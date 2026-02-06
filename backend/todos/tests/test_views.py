"""
Tests for Todo views/API endpoints.
"""
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from todos.models import Todo

User = get_user_model()


@pytest.mark.django_db
class TestTodoListCreate:
    """Test cases for listing and creating todos."""

    def test_list_todos_authenticated(self, api_client, user_with_todos):
        """Test listing todos for authenticated user."""
        # Authenticate with the user that has todos
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user_with_todos)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        url = reverse('todo-list-create')
        response = api_client.get(url)

        assert response.status_code == 200
        # Response is paginated
        assert response.data['count'] == 3  # User has 3 todos
        results = response.data['results']
        assert len(results) == 3

        # Check ordering: priority descending, then created_at descending
        assert results[0]['title'] == 'High priority task'
        assert results[0]['priority'] == 10

    def test_list_todos_only_own(self, api_client, user_with_todos):
        """Test that users only see their own todos."""
        # Authenticate with the user that has todos
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user_with_todos)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        # Create another user with todos
        other_user = User.objects.create_user(
            email='other@example.com',
            password='Password123!',
            auth_method='password'
        )
        Todo.objects.create(
            user=other_user,
            title='Other user todo',
            priority=100
        )

        url = reverse('todo-list-create')
        response = api_client.get(url)

        assert response.status_code == 200
        # Response is paginated
        assert response.data['count'] == 3  # Only user_with_todos's todos
        results = response.data['results']

        # Verify other user's todo is not in the list
        titles = [todo['title'] for todo in results]
        assert 'Other user todo' not in titles

    def test_list_todos_unauthenticated(self, api_client):
        """Test that unauthenticated users cannot list todos."""
        url = reverse('todo-list-create')
        response = api_client.get(url)

        assert response.status_code == 401

    def test_create_todo(self, auth_client):
        """Test creating a new todo."""
        url = reverse('todo-list-create')
        data = {
            'title': 'New Todo',
            'description': 'New description',
            'priority': 7
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 201
        assert response.data['title'] == 'New Todo'
        assert response.data['description'] == 'New description'
        assert response.data['priority'] == 7
        assert not response.data['completed']
        assert 'id' in response.data

        # Verify todo was created
        todo = Todo.objects.get(id=response.data['id'])
        assert todo.user == auth_client.user

    def test_create_todo_minimal_data(self, auth_client):
        """Test creating todo with only required fields."""
        url = reverse('todo-list-create')
        data = {
            'title': 'Minimal Todo'
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 201
        assert response.data['title'] == 'Minimal Todo'
        assert response.data['description'] == ''
        assert response.data['priority'] == 0

    def test_create_todo_empty_title(self, auth_client):
        """Test that creating todo with empty title fails."""
        url = reverse('todo-list-create')
        data = {
            'title': '   ',  # Whitespace only
            'description': 'Description'
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'title' in response.data

    def test_create_todo_unauthenticated(self, api_client):
        """Test that unauthenticated users cannot create todos."""
        url = reverse('todo-list-create')
        data = {
            'title': 'New Todo'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 401


@pytest.mark.django_db
class TestTodoRetrieveUpdateDestroy:
    """Test cases for retrieving, updating, and deleting todos."""

    def test_retrieve_todo(self, auth_client, user_with_todos):
        """Test retrieving a specific todo."""
        todo = Todo.objects.filter(user=auth_client.user).first()
        url = reverse('todo-detail', kwargs={'pk': todo.id})

        response = auth_client.get(url)

        assert response.status_code == 200
        assert response.data['id'] == str(todo.id)
        assert response.data['title'] == todo.title

    def test_retrieve_other_users_todo(self, auth_client):
        """Test that users cannot retrieve other users' todos."""
        # Create another user with a todo
        other_user = User.objects.create_user(
            email='other@example.com',
            password='Password123!',
            auth_method='password'
        )
        other_todo = Todo.objects.create(
            user=other_user,
            title='Other user todo'
        )

        url = reverse('todo-detail', kwargs={'pk': other_todo.id})
        response = auth_client.get(url)

        assert response.status_code == 404

    def test_update_todo(self, auth_client, user_with_todos):
        """Test updating a todo."""
        todo = Todo.objects.filter(user=auth_client.user).first()
        url = reverse('todo-detail', kwargs={'pk': todo.id})

        data = {
            'title': 'Updated Title',
            'completed': True,
            'priority': 9
        }

        response = auth_client.patch(url, data, format='json')

        assert response.status_code == 200
        assert response.data['title'] == 'Updated Title'
        assert response.data['completed'] is True
        assert response.data['priority'] == 9

        # Verify in database
        todo.refresh_from_db()
        assert todo.title == 'Updated Title'
        assert todo.completed is True

    def test_update_todo_partial(self, auth_client, user_with_todos):
        """Test partial update of a todo."""
        todo = Todo.objects.filter(user=auth_client.user).first()
        original_title = todo.title

        url = reverse('todo-detail', kwargs={'pk': todo.id})
        data = {
            'completed': True
        }

        response = auth_client.patch(url, data, format='json')

        assert response.status_code == 200
        assert response.data['completed'] is True
        assert response.data['title'] == original_title  # Title unchanged

    def test_update_other_users_todo(self, auth_client):
        """Test that users cannot update other users' todos."""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='Password123!',
            auth_method='password'
        )
        other_todo = Todo.objects.create(
            user=other_user,
            title='Other user todo'
        )

        url = reverse('todo-detail', kwargs={'pk': other_todo.id})
        data = {'completed': True}

        response = auth_client.patch(url, data, format='json')

        assert response.status_code == 404

    def test_delete_todo(self, auth_client, user_with_todos):
        """Test deleting a todo."""
        todo = Todo.objects.filter(user=auth_client.user).first()
        todo_id = todo.id

        url = reverse('todo-detail', kwargs={'pk': todo_id})
        response = auth_client.delete(url)

        assert response.status_code == 200
        assert 'deleted successfully' in response.data['message']

        # Verify todo was deleted
        assert not Todo.objects.filter(id=todo_id).exists()

    def test_delete_other_users_todo(self, auth_client):
        """Test that users cannot delete other users' todos."""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='Password123!',
            auth_method='password'
        )
        other_todo = Todo.objects.create(
            user=other_user,
            title='Other user todo'
        )

        url = reverse('todo-detail', kwargs={'pk': other_todo.id})
        response = auth_client.delete(url)

        assert response.status_code == 404

        # Verify todo was not deleted
        assert Todo.objects.filter(id=other_todo.id).exists()

    def test_todo_operations_unauthenticated(self, api_client, password_user):
        """Test that unauthenticated users cannot perform todo operations."""
        todo = Todo.objects.create(
            user=password_user,
            title='Test Todo'
        )

        url = reverse('todo-detail', kwargs={'pk': todo.id})

        # GET
        response = api_client.get(url)
        assert response.status_code == 401

        # PATCH
        response = api_client.patch(url, {'completed': True}, format='json')
        assert response.status_code == 401

        # DELETE
        response = api_client.delete(url)
        assert response.status_code == 401
