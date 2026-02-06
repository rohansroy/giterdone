# Contributing to Giterdone

Thank you for your interest in contributing to Giterdone! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project follows a Code of Conduct to ensure a welcoming environment for all contributors:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/giterdone.git
   cd giterdone
   ```
3. **Set up development environment**: Follow the [DEVELOPMENT.md](DEVELOPMENT.md) guide
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues or incorrect behavior
- **New features**: Add new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **Refactoring**: Improve code quality without changing behavior
- **UI/UX**: Enhance user interface and experience

### Areas Where We Need Help

- WebAuthn credential verification implementation
- Email functionality implementation
- Additional authentication methods
- Performance optimizations
- Accessibility improvements
- UI/UX enhancements
- Documentation improvements
- Test coverage expansion

## Development Workflow

### 1. Set Up Development Environment

Follow the [DEVELOPMENT.md](DEVELOPMENT.md) guide to set up your local environment.

### 2. Find or Create an Issue

- Check [existing issues](https://github.com/your-org/giterdone/issues) for something to work on
- Comment on the issue to let others know you're working on it
- If no issue exists for your contribution, create one first to discuss

### 3. Create a Branch

Create a branch from `main` with a descriptive name:

```bash
git checkout main
git pull origin main
git checkout -b type/description
```

Branch naming conventions:
- `feature/add-user-notifications` - New features
- `fix/todo-delete-bug` - Bug fixes
- `docs/api-documentation` - Documentation
- `refactor/auth-service` - Code refactoring
- `test/todo-endpoints` - Test additions

### 4. Make Your Changes

- Write clean, readable code
- Follow coding standards (see below)
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 5. Test Your Changes

**Backend:**
```bash
cd backend
uv run pytest --cov=. --cov-report=term
```

**Frontend:**
```bash
cd frontend
npm run lint
npm run build  # Ensures TypeScript compiles
```

**Integration:**
```bash
docker compose up
# Test the full application manually
```

### 6. Commit Your Changes

Follow the [commit guidelines](#commit-guidelines) below.

### 7. Push and Create Pull Request

```bash
git push origin your-branch-name
```

Then create a pull request on GitHub following the [PR process](#pull-request-process).

## Coding Standards

### Backend (Python/Django)

#### Style Guide
- Follow [PEP 8](https://pep8.org/) Python style guide
- Use 4 spaces for indentation
- Maximum line length: 88 characters (Black default)
- Use type hints for function parameters and return values

#### Code Examples

```python
# Good
from typing import Optional
from rest_framework import serializers

class TodoSerializer(serializers.ModelSerializer):
    """Serializer for Todo model."""

    def validate_title(self, value: str) -> str:
        """Validate that title is not empty or whitespace."""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value.strip()

    class Meta:
        model = Todo
        fields = ['id', 'title', 'completed', 'priority', 'due_date']
        read_only_fields = ['id']

# Bad
def validate_title(self,value):
    if not value or not value.strip():raise serializers.ValidationError("Title cannot be empty.")
    return value.strip()
```

#### Django Best Practices
- Use Django ORM, avoid raw SQL when possible
- Always use `get_queryset()` for filtering in views
- Use serializers for validation, not views
- Keep views thin, move logic to services or models
- Use transactions for operations that modify multiple objects

```python
# Good - User isolation in viewset
class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

### Frontend (TypeScript/React)

#### Style Guide
- Use TypeScript for all new code
- Use functional components with hooks
- Use 2 spaces for indentation
- Use meaningful variable and function names
- Prefer `const` over `let`, avoid `var`

#### Code Examples

```typescript
// Good
import React, { useState, useEffect } from 'react';
import { Todo } from '../types';
import api from '../services/api';

interface TodoListProps {
  userId: string;
}

export const TodoList: React.FC<TodoListProps> = ({ userId }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await api.get<Todo[]>('/todos/');
        setTodos(response.data);
      } catch (err) {
        setError('Failed to load todos');
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
};

// Bad
export const TodoList = (props) => {
  let [todos,setTodos]=useState([])
  // Missing error handling, type safety, loading states
  useEffect(()=>{
    api.get('/todos/').then(res=>setTodos(res.data))
  },[])
  return <div>{todos.map(t=><div>{t.title}</div>)}</div>
}
```

#### React Best Practices
- Extract reusable logic into custom hooks
- Keep components focused and single-purpose
- Use proper TypeScript types, avoid `any`
- Handle loading and error states
- Use proper accessibility attributes
- Memoize expensive computations with `useMemo`

```typescript
// Good - Custom hook for API calls
import { useState, useEffect } from 'react';
import api from '../services/api';

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<T>(endpoint);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Usage
const { data: todos, loading, error } = useApi<Todo[]>('/todos/');
```

### General Guidelines

- **DRY (Don't Repeat Yourself)**: Extract common code into reusable functions/components
- **KISS (Keep It Simple, Stupid)**: Write simple, readable code
- **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until needed
- **Write self-documenting code**: Use clear names instead of excessive comments
- **Add comments for complex logic**: Explain "why", not "what"

## Testing Guidelines

### Backend Testing

#### Test Coverage Requirements
- Maintain at least 95% code coverage
- Test both success and failure cases
- Test edge cases and boundary conditions
- Test user isolation and permissions

#### Test Structure
```python
import pytest
from rest_framework.test import APIClient

class TestTodoViewSet:
    """Tests for Todo API endpoints."""

    def test_list_todos_authenticated(self, auth_client):
        """Test that authenticated users can list their todos."""
        # Arrange
        Todo.objects.create(user=auth_client.user, title="Test")

        # Act
        response = auth_client.get('/api/todos/')

        # Assert
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_list_todos_unauthenticated(self, api_client):
        """Test that unauthenticated users cannot list todos."""
        response = api_client.get('/api/todos/')
        assert response.status_code == 401

    def test_create_todo_with_invalid_data(self, auth_client):
        """Test creating todo with empty title fails."""
        response = auth_client.post('/api/todos/', {'title': ''})
        assert response.status_code == 400
        assert 'title' in response.data
```

#### Use Fixtures
```python
# conftest.py
@pytest.fixture
def todo(db, password_user):
    """Create and return a sample todo."""
    return Todo.objects.create(
        user=password_user,
        title='Test Todo',
        priority=5
    )
```

### Frontend Testing

For now, focus on:
- ESLint for code quality
- TypeScript for type safety
- Manual testing of UI flows

Future: Add Jest/Vitest and React Testing Library

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples

```bash
feat(todos): add priority sorting to todo list

- Implement priority-based sorting
- Add priority field to todo form
- Update API to return sorted todos

Closes #123

fix(auth): resolve token refresh race condition

- Add mutex to prevent concurrent refresh attempts
- Update token refresh logic in AuthContext
- Add tests for concurrent refresh scenarios

Fixes #456

docs(readme): update installation instructions

- Add Docker Compose quick start section
- Update prerequisites list
- Fix broken links to documentation
```

### Commit Best Practices
- Keep commits atomic and focused
- Write clear, descriptive messages
- Reference issue numbers when applicable
- Use present tense ("add feature" not "added feature")
- Keep subject line under 72 characters
- Separate subject from body with blank line

## Pull Request Process

### Before Submitting

1. **Update from main**:
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run all tests**:
   ```bash
   cd backend && uv run pytest --cov=.
   cd ../frontend && npm run lint
   ```

3. **Check for conflicts**: Resolve any merge conflicts

4. **Update documentation**: If your changes affect usage

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Related Issue
Fixes #(issue number)

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
Describe how you tested your changes:
- [ ] All existing tests pass
- [ ] Added new tests
- [ ] Manually tested in browser
- [ ] Tested with Docker Compose

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
```

### Review Process

1. **Automated checks**: Ensure CI passes (when set up)
2. **Code review**: Address reviewer feedback
3. **Approval**: At least one maintainer approval required
4. **Merge**: Maintainer will merge when ready

### After Merge

1. **Delete your branch**: Both locally and on GitHub
2. **Update your fork**:
   ```bash
   git checkout main
   git pull origin main
   ```

## Reporting Bugs

### Before Submitting a Bug Report

- Check existing issues to avoid duplicates
- Verify the bug exists in the latest version
- Collect information about your environment

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Ubuntu]
- Browser: [e.g., Chrome 120]
- Docker: [Yes/No]
- Version: [e.g., commit hash or tag]

**Additional context**
Any other context about the problem.

**Logs**
Relevant logs from backend/frontend.
```

## Suggesting Enhancements

### Enhancement Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Any other context, screenshots, or examples.

**Would you like to implement this?**
[ ] Yes, I'd like to work on this
[ ] No, just suggesting
```

## Questions?

- Open a discussion on GitHub
- Check the [DEVELOPMENT.md](DEVELOPMENT.md) guide
- Review existing issues and PRs
- Read the [API Documentation](backend/API_DOCUMENTATION.md)

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes for their contributions
- Future CONTRIBUTORS.md file

Thank you for contributing to Giterdone! 🎉
