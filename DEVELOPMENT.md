# Development Guide

This guide covers setting up the Giterdone application for local development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development with Docker](#development-with-docker)
- [Development without Docker](#development-without-docker)
- [Project Structure](#project-structure)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Code Style and Linting](#code-style-and-linting)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### For Docker Development
- Docker Desktop or Docker Engine with Docker Compose
- Git
- A code editor (VS Code, PyCharm, etc.)

### For Manual Development
- Python 3.13 or higher
- Node.js 20 or higher
- PostgreSQL 16 or higher
- Git
- uv (Python package manager)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd giterdone
```

### 2. Choose Your Development Method

You can develop using:
- **Docker Compose** (Recommended) - Easiest setup, consistent environment
- **Manual Setup** - More control, faster iterations

## Development with Docker

### Quick Start

```bash
# Start all services
docker compose up

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Database: localhost:5432
```

### Common Docker Commands

```bash
# Start services in detached mode
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend

# Stop services
docker compose down

# Stop and remove volumes (database data)
docker compose down -v

# Rebuild containers
docker compose up --build

# Run backend commands
docker compose exec backend uv run python manage.py migrate
docker compose exec backend uv run python manage.py createsuperuser
docker compose exec backend uv run pytest

# Run frontend commands
docker compose exec frontend npm install <package>
docker compose exec frontend npm run build

# Access database
docker compose exec db psql -U giterdone_user -d giterdone

# Open a shell in container
docker compose exec backend bash
docker compose exec frontend sh
```

### Hot Reloading

Both frontend and backend support hot reloading:
- **Frontend**: Vite dev server automatically reloads on file changes
- **Backend**: Django's runserver automatically reloads on file changes

## Development without Docker

### Backend Setup

#### 1. Install uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### 2. Set Up PostgreSQL

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb giterdone
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb giterdone
sudo -u postgres createuser giterdone_user -P
```

**Windows:**
Download and install from [PostgreSQL website](https://www.postgresql.org/download/windows/)

#### 3. Configure Backend

```bash
cd backend

# Install dependencies
uv sync

# Set up environment
cp .env.example .env
# Edit .env and update DB_HOST=localhost

# Run migrations
uv run python manage.py migrate

# Create superuser
uv run python manage.py createsuperuser

# Start development server
uv run python manage.py runserver
```

Backend will be available at http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev
```

Frontend will be available at http://localhost:5173

## Project Structure

```
giterdone/
├── backend/                       # Django backend
│   ├── giterdone/                 # Django project settings
│   │   ├── settings.py            # Main settings file
│   │   ├── urls.py                # URL routing
│   │   └── wsgi.py                # WSGI configuration
│   │
│   ├── users/                     # User authentication app
│   │   ├── models.py              # User model
│   │   ├── serializers.py         # API serializers
│   │   ├── views.py               # API views
│   │   ├── webauthn_utils.py      # WebAuthn utilities
│   │   └── tests/                 # User tests
│   │
│   ├── todos/                     # Todo management app
│   │   ├── models.py              # Todo model
│   │   ├── serializers.py         # API serializers
│   │   ├── views.py               # API views
│   │   └── tests/                 # Todo tests
│   │
│   ├── health/                    # Health check app
│   │   └── views.py               # Health check endpoint
│   │
│   ├── manage.py                  # Django management script
│   ├── pyproject.toml             # Python dependencies
│   ├── uv.lock                    # Dependency lock file
│   └── conftest.py                # Pytest fixtures
│
├── frontend/                      # React frontend
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── auth/              # Authentication components
│   │   │   ├── layout/            # Layout components
│   │   │   ├── settings/          # Settings pages
│   │   │   └── todos/             # Todo components
│   │   │
│   │   ├── context/               # React Context providers
│   │   │   └── AuthContext.tsx    # Authentication context
│   │   │
│   │   ├── services/              # API services
│   │   │   ├── api.ts             # Axios configuration
│   │   │   └── webauthn.ts        # WebAuthn utilities
│   │   │
│   │   ├── utils/                 # Utility functions
│   │   │   └── dateFormatter.ts   # Date formatting
│   │   │
│   │   ├── App.tsx                # Main App component
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Global styles
│   │
│   ├── package.json               # Node dependencies
│   ├── vite.config.ts             # Vite configuration
│   ├── tsconfig.json              # TypeScript configuration
│   └── tailwind.config.js         # Tailwind CSS configuration
│
├── docker-compose.yml             # Docker Compose configuration
├── README.md                      # Project overview
├── DEVELOPMENT.md                 # This file
└── DEPLOYMENT.md                  # Deployment guide
```

## Backend Development

### Django Management Commands

```bash
# Run migrations
uv run python manage.py migrate

# Create migrations after model changes
uv run python manage.py makemigrations

# Create superuser
uv run python manage.py createsuperuser

# Run development server
uv run python manage.py runserver

# Django shell
uv run python manage.py shell

# Check for issues
uv run python manage.py check

# Collect static files
uv run python manage.py collectstatic
```

### Adding a New Django App

```bash
cd backend
uv run python manage.py startapp myapp

# Add to INSTALLED_APPS in giterdone/settings.py
# Create models, views, serializers, tests
```

### Working with Models

```python
# backend/todos/models.py example
from django.db import models
from users.models import User

class Todo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

# After changing models, create and run migrations
uv run python manage.py makemigrations
uv run python manage.py migrate
```

### API Development

```python
# backend/todos/views.py example
from rest_framework import viewsets, permissions
from .models import Todo
from .serializers import TodoSerializer

class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

### Database Management

```bash
# Access Django shell with database
uv run python manage.py shell

# Python shell example
from users.models import User
from todos.models import Todo

# Create a user
user = User.objects.create_user(
    email='test@example.com',
    password='password123',
    auth_method='password'
)

# Create a todo
todo = Todo.objects.create(
    user=user,
    title='Test todo',
    priority=5
)

# Query todos
todos = Todo.objects.filter(user=user)
```

## Frontend Development

### React Development

```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding Dependencies

```bash
# Install a package
npm install package-name

# Install a dev dependency
npm install -D package-name

# Update dependencies
npm update
```

### Component Structure

```typescript
// src/components/todos/TodoItem.tsx example
import React from 'react';

interface TodoItemProps {
  todo: {
    id: string;
    title: string;
    completed: boolean;
  };
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  return (
    <div className="flex items-center gap-2 p-4 border rounded">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span className={todo.completed ? 'line-through' : ''}>
        {todo.title}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
};
```

### API Integration

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Using the API
import api from '../services/api';

const fetchTodos = async () => {
  const response = await api.get('/todos/');
  return response.data;
};
```

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=. --cov-report=html --cov-report=term

# Run specific test file
uv run pytest users/tests/test_auth_views.py

# Run specific test
uv run pytest users/tests/test_auth_views.py::TestPasswordLogin::test_successful_login

# Run tests matching pattern
uv run pytest -k "test_login"

# View HTML coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### Writing Tests

```python
# backend/todos/tests/test_views.py example
import pytest
from rest_framework.test import APIClient
from users.models import User
from todos.models import Todo

@pytest.fixture
def auth_client(db):
    """Return authenticated API client"""
    user = User.objects.create_user(
        email='test@example.com',
        password='password123',
        auth_method='password'
    )
    client = APIClient()
    # Get JWT token and authenticate
    response = client.post('/api/auth/login/password/', {
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = response.data['tokens']['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    client.user = user
    return client

def test_list_todos(auth_client):
    """Test listing user's todos"""
    # Create test data
    Todo.objects.create(user=auth_client.user, title='Test todo')

    # Make request
    response = auth_client.get('/api/todos/')

    # Assert
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['title'] == 'Test todo'
```

### Frontend Tests

```bash
cd frontend

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Code Style and Linting

### Backend (Python)

The project uses Python best practices:

```bash
# Format code with black (if installed)
black .

# Sort imports with isort (if installed)
isort .

# Type checking with mypy (if installed)
mypy .
```

### Frontend (TypeScript)

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Type checking
npm run build  # Vite performs type checking during build
```

## Common Tasks

### Reset Database

```bash
# With Docker
docker compose down -v
docker compose up -d
docker compose exec backend uv run python manage.py migrate

# Without Docker
dropdb giterdone
createdb giterdone
cd backend
uv run python manage.py migrate
```

### Create Sample Data

```python
# backend/create_sample_data.py
from users.models import User
from todos.models import Todo
from datetime import datetime, timedelta

# Create a test user
user = User.objects.create_user(
    email='demo@example.com',
    password='Demo1234!',
    auth_method='password'
)

# Create sample todos
todos = [
    {'title': 'Complete project documentation', 'priority': 10},
    {'title': 'Review pull requests', 'priority': 8},
    {'title': 'Update dependencies', 'priority': 5},
    {'title': 'Write blog post', 'priority': 3},
]

for todo_data in todos:
    Todo.objects.create(user=user, **todo_data)

print(f"Created user: {user.email}")
print(f"Created {len(todos)} sample todos")

# Run with: uv run python manage.py shell < create_sample_data.py
```

### Update Dependencies

**Backend:**
```bash
cd backend
uv sync --upgrade
```

**Frontend:**
```bash
cd frontend
npm update
```

### View API Documentation

Access the Django REST Framework browsable API:
- http://localhost:8000/api/
- http://localhost:8000/api/todos/
- http://localhost:8000/api/auth/profile/

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # Database

# Kill process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
# macOS
brew services list

# Ubuntu/Debian
sudo systemctl status postgresql

# With Docker
docker compose ps
docker compose logs db
```

### Module Not Found Error (Backend)

```bash
cd backend
uv sync  # Reinstall dependencies
```

### Package Not Found Error (Frontend)

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Permission Denied (Docker)

```bash
# Fix permissions for volumes
sudo chown -R $USER:$USER .
```

### Hot Reload Not Working

**Backend:**
- Ensure `DEBUG=True` in `.env`
- Check if runserver is running
- Try restarting the server

**Frontend:**
- Clear Vite cache: `rm -rf node_modules/.vite`
- Restart dev server
- Check browser console for errors

### CORS Errors

Check backend `.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Migration Conflicts

```bash
# Reset migrations (development only!)
cd backend
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
uv run python manage.py makemigrations
uv run python manage.py migrate
```

## Development Best Practices

1. **Always create feature branches**: Don't commit directly to main
2. **Write tests**: Maintain the 97% coverage
3. **Keep dependencies updated**: Regularly update packages
4. **Use type hints**: Add type annotations to Python code
5. **Follow conventions**: Use consistent naming and structure
6. **Document changes**: Update relevant documentation
7. **Test before pushing**: Run tests locally before pushing
8. **Use meaningful commits**: Write clear commit messages
9. **Review your code**: Self-review before creating PRs
10. **Keep secrets safe**: Never commit `.env` files

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WebAuthn Guide](https://webauthn.guide/)

## Getting Help

- Check the [API Documentation](backend/API_DOCUMENTATION.md)
- Review the [Test Summary](backend/TEST_SUMMARY.md)
- Search existing issues on GitHub
- Ask questions in discussions
- Review commit history for examples

Happy coding! 🚀
