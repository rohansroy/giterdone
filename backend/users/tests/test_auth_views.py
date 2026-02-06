"""
Tests for authentication views.
"""
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
import pyotp

User = get_user_model()


@pytest.mark.django_db
class TestUserRegistration:
    """Test cases for user registration."""

    def test_register_with_password(self, api_client):
        """Test successful registration with password."""
        url = reverse('user-register')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'auth_method': 'password'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 201
        assert 'user' in response.data
        assert 'tokens' in response.data
        assert response.data['user']['email'] == 'newuser@example.com'
        assert response.data['user']['auth_method'] == 'password'
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']

        # Verify user was created
        user = User.objects.get(email='newuser@example.com')
        assert user.check_password('SecurePassword123!')

    def test_register_with_passkey(self, api_client):
        """Test successful registration with passkey."""
        url = reverse('user-register')
        data = {
            'email': 'passkey@example.com',
            'auth_method': 'passkey'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 201
        assert response.data['user']['auth_method'] == 'passkey'

    def test_register_password_mismatch(self, api_client):
        """Test registration fails when passwords don't match."""
        url = reverse('user-register')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'DifferentPassword123!',
            'auth_method': 'password'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'password_confirm' in response.data

    def test_register_missing_password_for_password_auth(self, api_client):
        """Test registration fails when password is missing for password auth."""
        url = reverse('user-register')
        data = {
            'email': 'newuser@example.com',
            'auth_method': 'password'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'password' in response.data

    def test_register_duplicate_email(self, api_client, password_user):
        """Test registration fails with duplicate email."""
        url = reverse('user-register')
        data = {
            'email': password_user.email,
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'auth_method': 'password'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 400


@pytest.mark.django_db
class TestPasswordLogin:
    """Test cases for password-based login."""

    def test_successful_login(self, api_client, password_user):
        """Test successful login with correct credentials."""
        url = reverse('password-login')
        data = {
            'email': password_user.email,
            'password': 'TestPassword123!'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 200
        assert 'user' in response.data
        assert 'tokens' in response.data
        assert response.data['message'] == 'Login successful.'

    def test_login_wrong_password(self, api_client, password_user):
        """Test login fails with wrong password."""
        url = reverse('password-login')
        data = {
            'email': password_user.email,
            'password': 'WrongPassword123!'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 401
        assert 'error' in response.data

    def test_login_nonexistent_user(self, api_client):
        """Test login fails with non-existent email."""
        url = reverse('password-login')
        data = {
            'email': 'nonexistent@example.com',
            'password': 'Password123!'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 401

    def test_login_wrong_auth_method(self, api_client, passkey_user):
        """Test login fails when trying password auth on passkey account."""
        url = reverse('password-login')
        data = {
            'email': passkey_user.email,
            'password': 'Password123!'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'passkey' in response.data['error']

    def test_login_with_totp_missing_code(self, api_client, totp_user):
        """Test login with TOTP enabled but no code provided."""
        url = reverse('password-login')
        data = {
            'email': totp_user.email,
            'password': 'TestPassword123!'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 400
        assert response.data['totp_required'] is True

    def test_login_with_totp_valid_code(self, api_client, totp_user):
        """Test login with TOTP enabled and valid code."""
        totp = pyotp.TOTP(totp_user.totp_secret)
        valid_code = totp.now()

        url = reverse('password-login')
        data = {
            'email': totp_user.email,
            'password': 'TestPassword123!',
            'totp_code': valid_code
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 200
        assert 'tokens' in response.data

    def test_login_with_totp_invalid_code(self, api_client, totp_user):
        """Test login fails with invalid TOTP code."""
        url = reverse('password-login')
        data = {
            'email': totp_user.email,
            'password': 'TestPassword123!',
            'totp_code': '000000'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 401
        assert 'Invalid TOTP code' in response.data['error']


@pytest.mark.django_db
class TestUserProfile:
    """Test cases for user profile endpoint."""

    def test_get_profile_authenticated(self, auth_client):
        """Test getting profile for authenticated user."""
        url = reverse('user-profile')
        response = auth_client.get(url)

        assert response.status_code == 200
        assert response.data['email'] == auth_client.user.email

    def test_get_profile_unauthenticated(self, api_client):
        """Test getting profile fails without authentication."""
        url = reverse('user-profile')
        response = api_client.get(url)

        assert response.status_code == 401


@pytest.mark.django_db
class TestTOTPEnrollment:
    """Test cases for TOTP 2FA enrollment."""

    def test_enroll_totp(self, auth_client):
        """Test enrolling in TOTP 2FA."""
        url = reverse('totp-enroll')
        response = auth_client.post(url)

        assert response.status_code == 200
        assert 'qr_code' in response.data
        assert 'secret' in response.data
        assert response.data['qr_code'].startswith('data:image/png;base64,')

        # Verify secret was saved
        auth_client.user.refresh_from_db()
        assert auth_client.user.totp_secret is not None

    def test_verify_totp_valid_code(self, auth_client):
        """Test verifying TOTP with valid code."""
        # First enroll
        enroll_url = reverse('totp-enroll')
        enroll_response = auth_client.post(enroll_url)
        secret = enroll_response.data['secret']

        # Generate valid code
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        # Verify
        verify_url = reverse('totp-verify')
        data = {'code': valid_code}
        response = auth_client.post(verify_url, data, format='json')

        assert response.status_code == 200
        assert 'enabled successfully' in response.data['message']

        # Verify TOTP is enabled
        auth_client.user.refresh_from_db()
        assert auth_client.user.totp_enabled

    def test_verify_totp_invalid_code(self, auth_client):
        """Test verifying TOTP with invalid code."""
        # First enroll
        enroll_url = reverse('totp-enroll')
        auth_client.post(enroll_url)

        # Try invalid code
        verify_url = reverse('totp-verify')
        data = {'code': '000000'}
        response = auth_client.post(verify_url, data, format='json')

        assert response.status_code == 400
        assert 'Invalid TOTP code' in response.data['error']

    def test_disable_totp(self, auth_client):
        """Test disabling TOTP 2FA."""
        # Setup: Enroll and enable TOTP
        auth_client.user.totp_secret = 'JBSWY3DPEHPK3PXP'
        auth_client.user.totp_enabled = True
        auth_client.user.save()

        # Generate valid code
        totp = pyotp.TOTP(auth_client.user.totp_secret)
        valid_code = totp.now()

        # Disable
        url = reverse('totp-disable')
        data = {'code': valid_code}
        response = auth_client.post(url, data, format='json')

        assert response.status_code == 200
        assert 'disabled successfully' in response.data['message']

        # Verify TOTP is disabled
        auth_client.user.refresh_from_db()
        assert not auth_client.user.totp_enabled
        assert auth_client.user.totp_secret is None


@pytest.mark.django_db
class TestAccountRecovery:
    """Test cases for account recovery."""

    def test_request_recovery(self, api_client, password_user):
        """Test requesting account recovery."""
        url = reverse('recovery-request')
        data = {'email': password_user.email}

        response = api_client.post(url, data, format='json')

        assert response.status_code == 200
        assert 'recovery link has been sent' in response.data['message']

    def test_request_recovery_nonexistent_email(self, api_client):
        """Test requesting recovery for non-existent email (should still return success)."""
        url = reverse('recovery-request')
        data = {'email': 'nonexistent@example.com'}

        response = api_client.post(url, data, format='json')

        # Should return success to not reveal if email exists
        assert response.status_code == 200

    def test_confirm_recovery_with_password(self, api_client, password_user):
        """Test confirming account recovery with new password."""
        # Get recovery token from request response
        request_url = reverse('recovery-request')
        request_data = {'email': password_user.email}
        request_response = api_client.post(request_url, request_data, format='json')
        token = request_response.data['token']

        # Confirm recovery
        confirm_url = reverse('recovery-confirm')
        confirm_data = {
            'token': token,
            'new_auth_method': 'password',
            'password': 'NewPassword123!',
            'password_confirm': 'NewPassword123!'
        }

        response = api_client.post(confirm_url, confirm_data, format='json')

        assert response.status_code == 200
        assert 'Account recovered' in response.data['message']

        # Verify password was changed
        password_user.refresh_from_db()
        assert password_user.check_password('NewPassword123!')

    def test_confirm_recovery_invalid_token(self, api_client):
        """Test confirming recovery with invalid token."""
        url = reverse('recovery-confirm')
        data = {
            'token': 'invalid_token',
            'new_auth_method': 'password',
            'password': 'NewPassword123!',
            'password_confirm': 'NewPassword123!'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'Invalid or expired' in response.data['error']

    def test_confirm_recovery_switch_to_passkey(self, api_client, password_user):
        """Test confirming recovery and switching to passkey."""
        # Get recovery token
        request_url = reverse('recovery-request')
        request_data = {'email': password_user.email}
        request_response = api_client.post(request_url, request_data, format='json')
        token = request_response.data['token']

        # Confirm recovery with passkey
        confirm_url = reverse('recovery-confirm')
        confirm_data = {
            'token': token,
            'new_auth_method': 'passkey'
        }

        response = api_client.post(confirm_url, confirm_data, format='json')

        assert response.status_code == 200
        password_user.refresh_from_db()
        assert password_user.auth_method == 'passkey'


@pytest.mark.django_db
class TestPasskeyEnrollment:
    """Test cases for passkey enrollment."""

    def test_enroll_passkey(self, auth_client):
        """Test enrolling a passkey credential."""
        url = reverse('passkey-enroll')
        data = {
            'credential_response': {
                'id': 'test_credential_id',
                'type': 'public-key',
                'response': 'test_response'
            }
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 200
        assert 'enrolled successfully' in response.data['message']

        # Verify credential was stored
        auth_client.user.refresh_from_db()
        assert auth_client.user.passkey_credential is not None


@pytest.mark.django_db
class TestTokenRefresh:
    """Test cases for JWT token refresh."""

    def test_refresh_token(self, password_user, api_client):
        """Test refreshing JWT access token."""
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(password_user)
        url = reverse('token-refresh')
        data = {'refresh': str(refresh)}

        response = api_client.post(url, data, format='json')

        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data  # New refresh token due to rotation

    def test_refresh_token_invalid(self, api_client):
        """Test refreshing with invalid token."""
        url = reverse('token-refresh')
        data = {'refresh': 'invalid_token'}

        response = api_client.post(url, data, format='json')

        assert response.status_code == 401


@pytest.mark.django_db
class TestPasskeyLogin:
    """Test cases for passkey login."""

    def test_passkey_login_success(self, api_client, passkey_user):
        """Test successful passkey login."""
        url = reverse('passkey-login')
        data = {
            'email': passkey_user.email,
            'credential_response': {
                'id': 'test_credential_id',
                'type': 'public-key'
            }
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 200
        assert 'tokens' in response.data
        assert 'user' in response.data

    def test_passkey_login_nonexistent_user(self, api_client):
        """Test passkey login with non-existent email."""
        url = reverse('passkey-login')
        data = {
            'email': 'nonexistent@example.com',
            'credential_response': {'id': 'test'}
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 401

    def test_passkey_login_wrong_auth_method(self, api_client, password_user):
        """Test passkey login on password account."""
        url = reverse('passkey-login')
        data = {
            'email': password_user.email,
            'credential_response': {'id': 'test'}
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'password' in response.data['error']


@pytest.mark.django_db
class TestTOTPEnrollmentErrors:
    """Test error cases for TOTP enrollment."""

    def test_verify_totp_without_enrollment(self, auth_client):
        """Test verifying TOTP without enrolling first."""
        url = reverse('totp-verify')
        data = {'code': '123456'}

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'not enrolled' in response.data['error']

    def test_disable_totp_not_enabled(self, auth_client):
        """Test disabling TOTP when it's not enabled."""
        url = reverse('totp-disable')
        data = {'code': '123456'}

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'not enabled' in response.data['error']

    def test_disable_totp_invalid_code(self, auth_client):
        """Test disabling TOTP with invalid code."""
        # Enable TOTP first
        auth_client.user.totp_secret = 'JBSWY3DPEHPK3PXP'
        auth_client.user.totp_enabled = True
        auth_client.user.save()

        url = reverse('totp-disable')
        data = {'code': '000000'}

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'Invalid TOTP code' in response.data['error']


@pytest.mark.django_db
class TestAccountRecoveryEdgeCases:
    """Test edge cases for account recovery."""

    def test_recovery_confirm_nonexistent_user(self, api_client):
        """Test recovery confirm with token for deleted user."""
        from django.core.signing import TimestampSigner

        # Create and delete a user
        user = User.objects.create_user(
            email='temp@example.com',
            password='Password123!',
            auth_method='password'
        )
        user_id = user.id
        user.delete()

        # Create token for deleted user
        signer = TimestampSigner()
        token = signer.sign(str(user_id))

        url = reverse('recovery-confirm')
        data = {
            'token': token,
            'new_auth_method': 'password',
            'password': 'NewPassword123!',
            'password_confirm': 'NewPassword123!'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 404
        assert 'not found' in response.data['error']


@pytest.mark.django_db
class TestPasswordChange:
    """Test cases for password change functionality."""

    def test_successful_password_change(self, auth_client):
        """Test successful password change."""
        # Set a known password for the authenticated user
        auth_client.user.set_password('OldPassword123!@#$')
        auth_client.user.auth_method = 'password'
        auth_client.user.save()

        url = reverse('password-change')
        data = {
            'old_password': 'OldPassword123!@#$',
            'new_password': 'NewSecurePassword456!@#$',
            'new_password_confirm': 'NewSecurePassword456!@#$'
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 200
        assert 'message' in response.data
        assert 'successfully' in response.data['message'].lower()

        # Verify new password works
        auth_client.user.refresh_from_db()
        assert auth_client.user.check_password('NewSecurePassword456!@#$')
        assert not auth_client.user.check_password('OldPassword123!@#$')

    def test_password_change_incorrect_old_password(self, auth_client):
        """Test password change with incorrect old password."""
        auth_client.user.set_password('OldPassword123!@#$')
        auth_client.user.auth_method = 'password'
        auth_client.user.save()

        url = reverse('password-change')
        data = {
            'old_password': 'WrongPassword123!@#$',
            'new_password': 'NewSecurePassword456!@#$',
            'new_password_confirm': 'NewSecurePassword456!@#$'
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'error' in response.data
        assert 'incorrect' in response.data['error'].lower()

        # Verify password hasn't changed
        auth_client.user.refresh_from_db()
        assert auth_client.user.check_password('OldPassword123!@#$')

    def test_password_change_mismatched_new_passwords(self, auth_client):
        """Test password change when new passwords don't match."""
        auth_client.user.set_password('OldPassword123!@#$')
        auth_client.user.auth_method = 'password'
        auth_client.user.save()

        url = reverse('password-change')
        data = {
            'old_password': 'OldPassword123!@#$',
            'new_password': 'NewSecurePassword456!@#$',
            'new_password_confirm': 'DifferentPassword789!@#$'
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'new_password_confirm' in response.data

        # Verify password hasn't changed
        auth_client.user.refresh_from_db()
        assert auth_client.user.check_password('OldPassword123!@#$')

    def test_password_change_weak_new_password(self, auth_client):
        """Test password change with password that doesn't meet requirements."""
        auth_client.user.set_password('OldPassword123!@#$')
        auth_client.user.auth_method = 'password'
        auth_client.user.save()

        url = reverse('password-change')
        data = {
            'old_password': 'OldPassword123!@#$',
            'new_password': 'weak',
            'new_password_confirm': 'weak'
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'new_password' in response.data

        # Verify password hasn't changed
        auth_client.user.refresh_from_db()
        assert auth_client.user.check_password('OldPassword123!@#$')

    def test_password_change_same_as_old_password(self, auth_client):
        """Test password change when new password is same as old password."""
        auth_client.user.set_password('OldPassword123!@#$')
        auth_client.user.auth_method = 'password'
        auth_client.user.save()

        url = reverse('password-change')
        data = {
            'old_password': 'OldPassword123!@#$',
            'new_password': 'OldPassword123!@#$',
            'new_password_confirm': 'OldPassword123!@#$'
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 400
        assert 'new_password' in response.data

    def test_password_change_passkey_user_forbidden(self, auth_client):
        """Test that passkey users cannot change password."""
        auth_client.user.auth_method = 'passkey'
        auth_client.user.passkey_credential = {'credential_id': 'test123'}
        auth_client.user.save()

        url = reverse('password-change')
        data = {
            'old_password': 'SomePassword123!@#$',
            'new_password': 'NewSecurePassword456!@#$',
            'new_password_confirm': 'NewSecurePassword456!@#$'
        }

        response = auth_client.post(url, data, format='json')

        assert response.status_code == 403
        assert 'error' in response.data

    def test_password_change_requires_authentication(self, api_client):
        """Test that unauthenticated users cannot change password."""
        url = reverse('password-change')
        data = {
            'old_password': 'OldPassword123!@#$',
            'new_password': 'NewSecurePassword456!@#$',
            'new_password_confirm': 'NewSecurePassword456!@#$'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == 401

    def test_can_login_with_new_password(self, auth_client, api_client):
        """Test that user can login with new password after successful change."""
        # Set initial password
        auth_client.user.set_password('OldPassword123!@#$')
        auth_client.user.auth_method = 'password'
        auth_client.user.save()

        # Change password
        url = reverse('password-change')
        data = {
            'old_password': 'OldPassword123!@#$',
            'new_password': 'NewSecurePassword456!@#$',
            'new_password_confirm': 'NewSecurePassword456!@#$'
        }

        response = auth_client.post(url, data, format='json')
        assert response.status_code == 200

        # Try to login with new password
        login_url = reverse('password-login')
        login_data = {
            'email': auth_client.user.email,
            'password': 'NewSecurePassword456!@#$'
        }

        response = api_client.post(login_url, login_data, format='json')
        assert response.status_code == 200
        assert 'tokens' in response.data

        # Try to login with old password (should fail)
        login_data['password'] = 'OldPassword123!@#$'
        response = api_client.post(login_url, login_data, format='json')
        assert response.status_code == 401
