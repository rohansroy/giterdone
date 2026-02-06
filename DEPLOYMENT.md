# Deployment Guide

This guide covers deploying the Giterdone application to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Production Architecture](#production-architecture)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Database Setup](#database-setup)
- [Security Checklist](#security-checklist)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Server with Docker and Docker Compose installed
- Domain name (for HTTPS)
- SSL/TLS certificates (Let's Encrypt recommended)
- PostgreSQL database (managed or self-hosted)
- Minimum 2GB RAM, 2 CPU cores recommended
- Git installed

## Production Architecture

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (Reverse   │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐
     │   Frontend  │ │ Backend │  │  PostgreSQL │
     │   (React)   │ │(Django) │  │  Database   │
     └─────────────┘ └─────────┘  └─────────────┘
```

## Environment Configuration

### Backend Production Environment

Create `backend/.env` for production:

```env
# Django Settings
DEBUG=False
SECRET_KEY=<generate-a-secure-random-key-here>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# Database Configuration
DB_NAME=giterdone_prod
DB_USER=giterdone_user
DB_PASSWORD=<secure-database-password>
DB_HOST=db
DB_PORT=5432

# CORS Settings
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Email (for account recovery)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@yourdomain.com
EMAIL_HOST_PASSWORD=<email-password>
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Frontend Production Environment

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Generate Secure Secret Key

```python
# Run this in Python to generate a secure Django secret key
import secrets
print(secrets.token_urlsafe(50))
```

## Docker Deployment

### 1. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: giterdone-db-prod
    environment:
      POSTGRES_DB: giterdone_prod
      POSTGRES_USER: giterdone_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - giterdone-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: giterdone-backend-prod
    command: gunicorn giterdone.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120
    env_file:
      - ./backend/.env
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    expose:
      - 8000
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - giterdone-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: giterdone-frontend-prod
    restart: unless-stopped
    networks:
      - giterdone-network

  nginx:
    image: nginx:alpine
    container_name: giterdone-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - static_volume:/usr/share/nginx/html/static
      - media_volume:/usr/share/nginx/html/media
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - giterdone-network

networks:
  giterdone-network:
    driver: bridge

volumes:
  postgres_data_prod:
  static_volume:
  media_volume:
```

### 2. Production Backend Dockerfile

The production Dockerfile (`backend/Dockerfile.prod`) is already included. It uses Gunicorn and Whitenoise for static files.

### 3. Production Frontend Dockerfile

The production Dockerfile (`frontend/Dockerfile.prod`) is already included. It builds the React app and serves it with Nginx.

### 4. Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        client_max_body_size 10M;

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
        }

        # Django Admin
        location /admin/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
        }

        # Static files
        location /static/ {
            alias /usr/share/nginx/html/static/;
        }

        # Media files
        location /media/ {
            alias /usr/share/nginx/html/media/;
        }

        # Frontend (React app)
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 5. Deploy with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd giterdone

# Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.production
# Edit .env files with production values

# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec backend uv run python manage.py migrate

# Create superuser
docker compose -f docker-compose.prod.yml exec backend uv run python manage.py createsuperuser

# Collect static files
docker compose -f docker-compose.prod.yml exec backend uv run python manage.py collectstatic --noinput
```

## Manual Deployment

### Backend Deployment

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and setup
git clone <repository-url>
cd giterdone/backend

# Install dependencies
uv sync --frozen

# Set up environment
cp .env.example .env
# Edit .env with production values

# Run migrations
uv run python manage.py migrate

# Create superuser
uv run python manage.py createsuperuser

# Collect static files
uv run python manage.py collectstatic --noinput

# Start with Gunicorn
uv run gunicorn giterdone.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Frontend Deployment

```bash
cd giterdone/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve with a static file server (e.g., nginx, serve)
npx serve -s dist -l 5173
```

## Database Setup

### Managed PostgreSQL (Recommended)

Use a managed database service like:
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Databases
- Heroku Postgres

Update `backend/.env` with the connection details:
```env
DB_HOST=your-managed-db-host.com
DB_PORT=5432
DB_NAME=giterdone_prod
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE giterdone_prod;
CREATE USER giterdone_user WITH PASSWORD 'secure_password';
ALTER ROLE giterdone_user SET client_encoding TO 'utf8';
ALTER ROLE giterdone_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE giterdone_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE giterdone_prod TO giterdone_user;
\q
```

## Security Checklist

- [ ] Set `DEBUG=False` in production
- [ ] Generate and use a secure `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` with your domain(s)
- [ ] Enable HTTPS with valid SSL/TLS certificates
- [ ] Set secure cookie flags (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`)
- [ ] Enable HSTS headers
- [ ] Configure CORS with specific allowed origins
- [ ] Use strong database passwords
- [ ] Set up database backups
- [ ] Configure firewall rules (allow only 80, 443, SSH)
- [ ] Keep dependencies updated
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Use environment variables for secrets (never commit them)
- [ ] Disable directory listing
- [ ] Set appropriate file permissions

## Monitoring and Maintenance

### Health Checks

The application includes a health check endpoint:
```bash
curl https://yourdomain.com/health/
```

### Logging

**View logs:**
```bash
# All services
docker compose -f docker-compose.prod.yml logs

# Specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Follow logs
docker compose -f docker-compose.prod.yml logs -f backend
```

### Database Backups

**Automated backup script:**
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/giterdone_backup_$TIMESTAMP.sql"

docker compose -f docker-compose.prod.yml exec -T db pg_dump -U giterdone_user giterdone_prod > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "giterdone_backup_*.sql.gz" -mtime +7 -delete
```

**Set up cron job:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

### Updates and Maintenance

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec backend uv run python manage.py migrate

# Collect static files
docker compose -f docker-compose.prod.yml exec backend uv run python manage.py collectstatic --noinput
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Verify environment variables
docker compose -f docker-compose.prod.yml exec backend env

# Check database connection
docker compose -f docker-compose.prod.yml exec backend uv run python manage.py check --database default
```

### Database Connection Issues

```bash
# Test database connectivity
docker compose -f docker-compose.prod.yml exec db psql -U giterdone_user -d giterdone_prod -c "SELECT 1;"

# Check database logs
docker compose -f docker-compose.prod.yml logs db
```

### Static Files Not Loading

```bash
# Recollect static files
docker compose -f docker-compose.prod.yml exec backend uv run python manage.py collectstatic --noinput --clear

# Check nginx configuration
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### High Memory Usage

```bash
# Check container resource usage
docker stats

# Reduce Gunicorn workers in docker-compose.prod.yml
# Change: --workers 4 to --workers 2
```

### SSL Certificate Issues

```bash
# Verify certificate files
ls -la nginx/ssl/

# Check certificate expiration
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates

# Test SSL configuration
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

## Performance Optimization

### Enable Redis Caching

Add Redis to `docker-compose.prod.yml`:
```yaml
redis:
  image: redis:alpine
  container_name: giterdone-redis-prod
  restart: unless-stopped
  networks:
    - giterdone-network
```

Update `backend/.env`:
```env
REDIS_URL=redis://redis:6379/0
```

### Database Optimization

```sql
-- Create indexes for better query performance
CREATE INDEX idx_todos_user_id ON todos_todo(user_id);
CREATE INDEX idx_todos_priority ON todos_todo(priority);
CREATE INDEX idx_todos_due_date ON todos_todo(due_date);
```

### CDN for Static Files

Consider using a CDN like CloudFlare or AWS CloudFront for serving static assets.

## Scaling Considerations

- Use a load balancer (e.g., AWS ALB, nginx) for multiple backend instances
- Consider separate database server for production
- Implement Redis for session storage and caching
- Use container orchestration (Kubernetes, Docker Swarm) for larger deployments
- Set up read replicas for database if read-heavy

## Support

For deployment issues:
1. Check logs first
2. Review the troubleshooting section
3. Verify environment configuration
4. Check database connectivity
5. Open an issue on GitHub with relevant logs
