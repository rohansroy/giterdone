"""
Tests for todo serializers.
"""
import pytest
from django.contrib.auth import get_user_model
from todos.serializers import TodoSerializer, TodoCreateSerializer, TodoUpdateSerializer
from todos.models import Todo

User = get_user_model()


@pytest.mark.django_db
class TestTodoSerializer:
    """Test cases for TodoSerializer."""

    def test_serialize_todo(self, password_user):
        """Test serializing a todo."""
        todo = Todo.objects.create(
            user=password_user,
            title='Test Todo',
            description='Test description',
            priority=5
        )

        serializer = TodoSerializer(todo)

        assert serializer.data['title'] == 'Test Todo'
        assert serializer.data['description'] == 'Test description'
        assert serializer.data['priority'] == 5
        assert 'id' in serializer.data
        assert 'created_at' in serializer.data


@pytest.mark.django_db
class TestTodoCreateSerializer:
    """Test cases for TodoCreateSerializer."""

    def test_empty_title_validation(self):
        """Test that empty title is rejected."""
        data = {
            'title': '',
            'description': 'Test'
        }
        serializer = TodoCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'title' in serializer.errors

    def test_whitespace_only_title_validation(self):
        """Test that whitespace-only title is rejected."""
        data = {
            'title': '   ',
            'description': 'Test'
        }
        serializer = TodoCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'title' in serializer.errors

    def test_title_trimmed(self, password_user, api_client):
        """Test that title whitespace is trimmed."""
        from rest_framework.request import Request
        from django.test import RequestFactory

        factory = RequestFactory()
        request = factory.post('/')
        request.user = password_user

        data = {
            'title': '  Test Todo  ',
            'description': 'Test'
        }

        serializer = TodoCreateSerializer(data=data, context={'request': request})
        assert serializer.is_valid()

        todo = serializer.save()
        assert todo.title == 'Test Todo'  # Whitespace trimmed

    def test_valid_todo_creation(self, password_user):
        """Test creating a valid todo."""
        from rest_framework.request import Request
        from django.test import RequestFactory

        factory = RequestFactory()
        request = factory.post('/')
        request.user = password_user

        data = {
            'title': 'New Todo',
            'description': 'Description',
            'priority': 10
        }

        serializer = TodoCreateSerializer(data=data, context={'request': request})
        assert serializer.is_valid()

        todo = serializer.save()
        assert todo.user == password_user
        assert todo.title == 'New Todo'


@pytest.mark.django_db
class TestTodoUpdateSerializer:
    """Test cases for TodoUpdateSerializer."""

    def test_empty_title_validation(self):
        """Test that empty title is rejected on update."""
        data = {
            'title': '',
            'completed': True
        }
        serializer = TodoUpdateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'title' in serializer.errors

    def test_partial_update_validation(self):
        """Test partial update with only completed field."""
        data = {
            'completed': True
        }
        serializer = TodoUpdateSerializer(data=data, partial=True)

        assert serializer.is_valid()

    def test_update_all_fields(self):
        """Test updating all fields."""
        data = {
            'title': 'Updated Title',
            'description': 'Updated Description',
            'completed': True,
            'priority': 8
        }
        serializer = TodoUpdateSerializer(data=data)

        assert serializer.is_valid()
        assert serializer.validated_data['title'] == 'Updated Title'
        assert serializer.validated_data['completed'] is True
