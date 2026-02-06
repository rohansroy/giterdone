"""
Pytest configuration and fixtures for the Giterdone backend.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api_client():
    """Return an API client for making requests."""
    return APIClient()


@pytest.fixture
def password_user(db):
    """Create a test user with password authentication."""
    user = User.objects.create_user(
        email='test@example.com',
        password='TestPassword123!',
        auth_method='password'
    )
    return user


@pytest.fixture
def passkey_user(db):
    """Create a test user with passkey authentication."""
    user = User.objects.create_user(
        email='passkey@example.com',
        password=None,
        auth_method='passkey'
    )
    user.passkey_credential = {'id': 'test_credential_id'}
    user.save()
    return user


@pytest.fixture
def totp_user(db):
    """Create a test user with TOTP 2FA enabled."""
    user = User.objects.create_user(
        email='totp@example.com',
        password='TestPassword123!',
        auth_method='password'
    )
    user.totp_secret = 'JBSWY3DPEHPK3PXP'  # Test secret
    user.totp_enabled = True
    user.save()
    return user


@pytest.fixture
def auth_client(api_client, password_user):
    """Return an authenticated API client."""
    refresh = RefreshToken.for_user(password_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    api_client.user = password_user
    return api_client


@pytest.fixture
def user_with_todos(password_user, db):
    """Create a user with some todos."""
    from todos.models import Todo

    Todo.objects.create(
        user=password_user,
        title='High priority task',
        description='Important work',
        priority=10,
        completed=False
    )
    Todo.objects.create(
        user=password_user,
        title='Low priority task',
        description='Less important',
        priority=1,
        completed=False
    )
    Todo.objects.create(
        user=password_user,
        title='Completed task',
        description='Already done',
        priority=5,
        completed=True
    )

    return password_user
