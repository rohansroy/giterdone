"""
Tests for User model.
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Test cases for the User model."""

    def test_create_user_with_password(self):
        """Test creating a user with password authentication."""
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPassword123!',
            auth_method='password'
        )

        assert user.email == 'test@example.com'
        assert user.auth_method == 'password'
        assert user.check_password('TestPassword123!')
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser
        assert user.id is not None

    def test_create_user_with_passkey(self):
        """Test creating a user with passkey authentication."""
        user = User.objects.create_user(
            email='passkey@example.com',
            password=None,
            auth_method='passkey'
        )

        assert user.email == 'passkey@example.com'
        assert user.auth_method == 'passkey'
        # Password should be None or null for passkey users
        assert user.password is None or user.password == ''
        assert user.is_active

    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='AdminPassword123!'
        )

        assert user.email == 'admin@example.com'
        assert user.is_staff
        assert user.is_superuser
        assert user.auth_method == 'password'
        assert user.check_password('AdminPassword123!')

    def test_user_email_unique(self):
        """Test that user emails must be unique."""
        User.objects.create_user(
            email='test@example.com',
            password='Password123!',
            auth_method='password'
        )

        with pytest.raises(Exception):  # IntegrityError
            User.objects.create_user(
                email='test@example.com',
                password='AnotherPassword123!',
                auth_method='password'
            )

    def test_user_str_representation(self):
        """Test the string representation of a user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='Password123!',
            auth_method='password'
        )

        assert str(user) == 'test@example.com'

    def test_has_usable_password(self):
        """Test has_usable_password method."""
        password_user = User.objects.create_user(
            email='password@example.com',
            password='Password123!',
            auth_method='password'
        )

        passkey_user = User.objects.create_user(
            email='passkey@example.com',
            password=None,
            auth_method='passkey'
        )

        assert password_user.has_usable_password()
        assert not passkey_user.has_usable_password()

    def test_totp_fields(self):
        """Test TOTP 2FA fields."""
        user = User.objects.create_user(
            email='test@example.com',
            password='Password123!',
            auth_method='password'
        )

        assert user.totp_secret is None
        assert not user.totp_enabled

        user.totp_secret = 'TESTSECRET123'
        user.totp_enabled = True
        user.save()

        user.refresh_from_db()
        assert user.totp_secret == 'TESTSECRET123'
        assert user.totp_enabled

    def test_create_user_without_email(self):
        """Test that creating user without email raises error."""
        with pytest.raises(ValueError, match='Email field must be set'):
            User.objects.create_user(
                email='',
                password='Password123!',
                auth_method='password'
            )

    def test_create_superuser_not_staff(self):
        """Test that superuser must have is_staff=True."""
        with pytest.raises(ValueError, match='must have is_staff=True'):
            User.objects.create_superuser(
                email='admin@example.com',
                password='Password123!',
                is_staff=False
            )

    def test_create_superuser_not_superuser(self):
        """Test that superuser must have is_superuser=True."""
        with pytest.raises(ValueError, match='must have is_superuser=True'):
            User.objects.create_superuser(
                email='admin@example.com',
                password='Password123!',
                is_superuser=False
            )
