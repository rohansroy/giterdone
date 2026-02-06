from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserRegistrationView,
    PasswordLoginView,
    CheckAuthMethodView,
    PasskeyRegistrationOptionsView,
    PasskeyLoginOptionsView,
    PasskeyLoginView,
    UserProfileView,
    ProfileUpdateView,
    TOTPEnrollView,
    TOTPVerifyView,
    TOTPDisableView,
    AccountRecoveryRequestView,
    AccountRecoveryConfirmView,
    PasskeyEnrollView,
    PasswordChangeView,
)

urlpatterns = [
    # Registration and Login
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/password/', PasswordLoginView.as_view(), name='password-login'),
    path('login/check-method/', CheckAuthMethodView.as_view(), name='check-auth-method'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # User Profile
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),

    # Password Management
    path('password/change/', PasswordChangeView.as_view(), name='password-change'),

    # TOTP 2FA
    path('totp/enroll/', TOTPEnrollView.as_view(), name='totp-enroll'),
    path('totp/verify/', TOTPVerifyView.as_view(), name='totp-verify'),
    path('totp/disable/', TOTPDisableView.as_view(), name='totp-disable'),

    # Account Recovery
    path('recovery/request/', AccountRecoveryRequestView.as_view(), name='recovery-request'),
    path('recovery/confirm/', AccountRecoveryConfirmView.as_view(), name='recovery-confirm'),

    # Passkey Management
    path('passkey/registration/options/', PasskeyRegistrationOptionsView.as_view(), name='passkey-registration-options'),
    path('passkey/registration/verify/', PasskeyEnrollView.as_view(), name='passkey-enroll'),
    path('passkey/login/options/', PasskeyLoginOptionsView.as_view(), name='passkey-login-options'),
    path('passkey/login/verify/', PasskeyLoginView.as_view(), name='passkey-login'),
]
