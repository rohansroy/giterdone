# Giterdone

A modern, secure todo management application with WebAuthn/Passkey authentication.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.13-blue.svg)
![Node](https://img.shields.io/badge/node-20-green.svg)
![Coverage](https://img.shields.io/badge/coverage-97%25-brightgreen.svg)

## Features

- **Secure Authentication**
  - WebAuthn/Passkey authentication (passwordless)
  - Traditional password authentication
  - TOTP 2FA support
  - JWT token-based API authentication
  - Account recovery system

- **Todo Management**
  - Create, read, update, and delete todos
  - Priority-based sorting
  - Due date tracking
  - User isolation (secure data access)

- **Modern Architecture**
  - RESTful API with Django REST Framework
  - React frontend with TypeScript
  - PostgreSQL database
  - Docker containerization
  - Comprehensive test coverage (97%)

## Technology Stack

### Backend
- **Language**: Python 3.13
- **Framework**: Django 5.2
- **API**: Django REST Framework
- **Authentication**: WebAuthn, JWT (Simple JWT)
- **Database**: PostgreSQL 16
- **Package Manager**: uv
- **Testing**: pytest, pytest-cov (97% coverage)
- **Production Server**: Gunicorn

### Frontend
- **Language**: TypeScript
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Linting**: ESLint

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Running with Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd giterdone
   ```

2. **Start the application**
   ```bash
   docker compose up
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api

The first time you run the application, Docker will:
- Build the frontend and backend containers
- Set up the PostgreSQL database
- Run Django migrations
- Start all services

### Manual Setup

If you prefer to run the application without Docker, see [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.

## Project Structure

```
giterdone/
├── backend/                  # Django backend
│   ├── giterdone/           # Django project settings
│   ├── users/               # User authentication & management
│   ├── todos/               # Todo management
│   ├── health/              # Health check endpoints
│   ├── manage.py            # Django management script
│   ├── pyproject.toml       # Python dependencies (uv)
│   └── Dockerfile           # Backend Docker configuration
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # State management
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   ├── package.json         # Node dependencies
│   └── Dockerfile           # Frontend Docker configuration
│
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # This file
```

## API Documentation

Comprehensive API documentation is available in [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md).

### Key Endpoints

- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/password/` - Password login
- `POST /api/auth/login/passkey/` - Passkey login
- `GET /api/auth/profile/` - Get user profile
- `GET /api/todos/` - List todos
- `POST /api/todos/` - Create todo
- `PATCH /api/todos/{id}/` - Update todo
- `DELETE /api/todos/{id}/` - Delete todo

## Testing

The backend has comprehensive test coverage (97%) with 84 tests. See [backend/TEST_SUMMARY.md](backend/TEST_SUMMARY.md) for details.

### Running Tests

**With Docker:**
```bash
docker compose exec backend uv run pytest
```

**With Coverage Report:**
```bash
docker compose exec backend uv run pytest --cov=. --cov-report=html --cov-report=term
```

**Without Docker:**
```bash
cd backend
uv run pytest --cov=. --cov-report=html --cov-report=term
```

## Development

For detailed development setup instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

### Key Commands

```bash
# Start development environment
docker compose up

# Rebuild containers after dependency changes
docker compose up --build

# Run backend migrations
docker compose exec backend uv run python manage.py migrate

# Create Django superuser
docker compose exec backend uv run python manage.py createsuperuser

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes (including database data)
docker compose down -v
```

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Security Features

- **WebAuthn/Passkey Authentication**: Modern, phishing-resistant authentication
- **JWT Tokens**: Secure API authentication with token rotation
- **TOTP 2FA**: Optional two-factor authentication
- **Password Validation**: Enforced strong password requirements
- **CORS Protection**: Configured CORS policies
- **Rate Limiting**: Protection against brute force attacks
- **User Isolation**: Users can only access their own data
- **Input Validation**: Comprehensive request validation
- **HTTPS Ready**: Production configuration supports HTTPS

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation in the `/backend` and `/frontend` directories
- Review API documentation for endpoint details

## Acknowledgments

- Built with Django REST Framework
- Uses WebAuthn for modern authentication
- Styled with Tailwind CSS
- Powered by Vite for fast development

## Environment Variables

### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=giterdone
DB_USER=giterdone_user
DB_PASSWORD=giterdone_password
DB_HOST=db
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

See `.env.example` files in each directory for complete examples.
