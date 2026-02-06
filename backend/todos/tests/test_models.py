"""
Tests for Todo model.
"""
import pytest
from django.contrib.auth import get_user_model
from todos.models import Todo

User = get_user_model()


@pytest.mark.django_db
class TestTodoModel:
    """Test cases for the Todo model."""

    def test_create_todo(self, password_user):
        """Test creating a basic todo."""
        todo = Todo.objects.create(
            user=password_user,
            title='Test Todo',
            description='Test description',
            priority=5
        )

        assert todo.title == 'Test Todo'
        assert todo.description == 'Test description'
        assert todo.priority == 5
        assert not todo.completed
        assert todo.user == password_user
        assert todo.id is not None

    def test_todo_default_values(self, password_user):
        """Test default values for todo fields."""
        todo = Todo.objects.create(
            user=password_user,
            title='Test Todo'
        )

        assert todo.description == ''
        assert not todo.completed
        assert todo.priority == 0
        assert todo.due_date is None

    def test_todo_str_representation(self, password_user):
        """Test the string representation of a todo."""
        todo = Todo.objects.create(
            user=password_user,
            title='Test Todo',
            completed=False
        )

        assert str(todo) == 'Test Todo (○)'

        todo.completed = True
        todo.save()

        assert str(todo) == 'Test Todo (✓)'

    def test_todo_ordering(self, password_user):
        """Test that todos are ordered by priority then created_at."""
        todo1 = Todo.objects.create(
            user=password_user,
            title='Low priority',
            priority=1
        )
        todo2 = Todo.objects.create(
            user=password_user,
            title='High priority',
            priority=10
        )
        todo3 = Todo.objects.create(
            user=password_user,
            title='Medium priority',
            priority=5
        )

        todos = list(Todo.objects.filter(user=password_user))

        # Should be ordered by priority descending
        assert todos[0] == todo2  # Priority 10
        assert todos[1] == todo3  # Priority 5
        assert todos[2] == todo1  # Priority 1

    def test_todo_cascade_delete_with_user(self, password_user):
        """Test that todos are deleted when user is deleted."""
        Todo.objects.create(
            user=password_user,
            title='Test Todo'
        )

        assert Todo.objects.filter(user=password_user).count() == 1

        user_id = password_user.id
        password_user.delete()

        # Check no todos exist for the deleted user
        assert Todo.objects.filter(user_id=user_id).count() == 0

    def test_todo_user_relationship(self, password_user):
        """Test the relationship between user and todos."""
        todo1 = Todo.objects.create(
            user=password_user,
            title='Todo 1'
        )
        todo2 = Todo.objects.create(
            user=password_user,
            title='Todo 2'
        )

        assert password_user.todos.count() == 2
        assert todo1 in password_user.todos.all()
        assert todo2 in password_user.todos.all()
