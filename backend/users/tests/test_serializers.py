"""
Tests for user serializers.
"""
import pytest
from users.serializers import (
    UserRegistrationSerializer,
    PasswordLoginSerializer,
    TOTPVerifySerializer,
    AccountRecoveryConfirmSerializer
)


@pytest.mark.django_db
class TestUserRegistrationSerializer:
    """Test cases for UserRegistrationSerializer."""

    def test_password_required_validation(self):
        """Test that password is required for password auth."""
        data = {
            'email': 'test@example.com',
            'auth_method': 'password',
            'password_confirm': 'Password123!'
        }
        serializer = UserRegistrationSerializer(data=data)

        assert not serializer.is_valid()
        assert 'password' in serializer.errors

    def test_passkey_should_not_have_password(self):
        """Test that passkey auth should not include password."""
        data = {
            'email': 'test@example.com',
            'auth_method': 'passkey',
            'password': 'Password123!',
            'password_confirm': 'Password123!'
        }
        serializer = UserRegistrationSerializer(data=data)

        assert not serializer.is_valid()
        assert 'password' in serializer.errors

    def test_weak_password_validation(self):
        """Test password validation with weak password."""
        data = {
            'email': 'test@example.com',
            'auth_method': 'password',
            'password': '123',
            'password_confirm': '123'
        }
        serializer = UserRegistrationSerializer(data=data)

        assert not serializer.is_valid()
        assert 'password' in serializer.errors


@pytest.mark.django_db
class TestPasswordLoginSerializer:
    """Test cases for PasswordLoginSerializer."""

    def test_valid_data(self):
        """Test serializer with valid login data."""
        data = {
            'email': 'test@example.com',
            'password': 'Password123!'
        }
        serializer = PasswordLoginSerializer(data=data)

        assert serializer.is_valid()

    def test_with_totp_code(self):
        """Test serializer with TOTP code."""
        data = {
            'email': 'test@example.com',
            'password': 'Password123!',
            'totp_code': '123456'
        }
        serializer = PasswordLoginSerializer(data=data)

        assert serializer.is_valid()
        assert serializer.validated_data['totp_code'] == '123456'


@pytest.mark.django_db
class TestTOTPVerifySerializer:
    """Test cases for TOTPVerifySerializer."""

    def test_valid_totp_code(self):
        """Test serializer with valid TOTP code."""
        data = {'code': '123456'}
        serializer = TOTPVerifySerializer(data=data)

        assert serializer.is_valid()

    def test_invalid_totp_code_non_numeric(self):
        """Test that non-numeric TOTP codes are rejected."""
        data = {'code': 'abcdef'}
        serializer = TOTPVerifySerializer(data=data)

        assert not serializer.is_valid()
        assert 'code' in serializer.errors

    def test_totp_code_too_short(self):
        """Test that short TOTP codes are rejected."""
        data = {'code': '123'}
        serializer = TOTPVerifySerializer(data=data)

        assert not serializer.is_valid()

    def test_totp_code_too_long(self):
        """Test that long TOTP codes are rejected."""
        data = {'code': '1234567'}
        serializer = TOTPVerifySerializer(data=data)

        assert not serializer.is_valid()


@pytest.mark.django_db
class TestAccountRecoveryConfirmSerializer:
    """Test cases for AccountRecoveryConfirmSerializer."""

    def test_password_required_for_password_auth(self):
        """Test that password is required when choosing password auth."""
        data = {
            'token': 'test_token',
            'new_auth_method': 'password'
        }
        serializer = AccountRecoveryConfirmSerializer(data=data)

        assert not serializer.is_valid()
        assert 'password' in serializer.errors

    def test_password_mismatch(self):
        """Test that password mismatch is caught."""
        data = {
            'token': 'test_token',
            'new_auth_method': 'password',
            'password': 'Password123!',
            'password_confirm': 'DifferentPassword123!'
        }
        serializer = AccountRecoveryConfirmSerializer(data=data)

        assert not serializer.is_valid()
        assert 'password_confirm' in serializer.errors

    def test_passkey_auth_no_password(self):
        """Test that passkey auth doesn't require password."""
        data = {
            'token': 'test_token',
            'new_auth_method': 'passkey'
        }
        serializer = AccountRecoveryConfirmSerializer(data=data)

        assert serializer.is_valid()
