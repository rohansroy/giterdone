from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
import pyotp
import qrcode
import io
import base64

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with password or passkey."""

    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )
    auth_method = serializers.ChoiceField(
        choices=['password', 'passkey'],
        required=True
    )

    class Meta:
        model = User
        fields = ['id', 'email', 'auth_method', 'password', 'password_confirm', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        auth_method = attrs.get('auth_method')
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        # Password auth requires password fields
        if auth_method == 'password':
            if not password:
                raise serializers.ValidationError({
                    'password': 'Password is required for password authentication.'
                })
            if password != password_confirm:
                raise serializers.ValidationError({
                    'password_confirm': 'Passwords do not match.'
                })

        # Passkey auth doesn't need password
        if auth_method == 'passkey':
            if password or password_confirm:
                raise serializers.ValidationError({
                    'password': 'Password should not be provided for passkey authentication.'
                })

        # Remove password_confirm before saving
        attrs.pop('password_confirm', None)
        return attrs

    def create(self, validated_data):
        auth_method = validated_data.get('auth_method')
        password = validated_data.pop('password', None)

        user = User.objects.create_user(
            email=validated_data['email'],
            password=password if auth_method == 'password' else None,
            auth_method=auth_method
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile information."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'auth_method', 'totp_enabled',
            'first_name', 'last_name', 'age', 'birthday', 'avatar_style',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'age', 'birthday', 'avatar_style']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'age': {'required': False},
            'birthday': {'required': False},
            'avatar_style': {'required': False},
        }


class PasswordLoginSerializer(serializers.Serializer):
    """Serializer for password-based login."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    totp_code = serializers.CharField(required=False, max_length=6, min_length=6)


class PasskeyLoginSerializer(serializers.Serializer):
    """Serializer for passkey-based login."""

    email = serializers.EmailField()
    credential_response = serializers.JSONField()


class TOTPEnrollSerializer(serializers.Serializer):
    """Serializer for TOTP enrollment."""

    def generate_totp_secret(self, user):
        """Generate TOTP secret and QR code for enrollment."""
        secret = pyotp.random_base32()
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name='Giterdone'
        )

        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

        return {
            'secret': secret,
            'qr_code': f'data:image/png;base64,{qr_code_base64}',
            'totp_uri': totp_uri
        }


class TOTPVerifySerializer(serializers.Serializer):
    """Serializer for TOTP verification."""

    code = serializers.CharField(max_length=6, min_length=6)

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('TOTP code must contain only digits.')
        return value


class AccountRecoveryRequestSerializer(serializers.Serializer):
    """Serializer for requesting account recovery."""

    email = serializers.EmailField()


class AccountRecoveryConfirmSerializer(serializers.Serializer):
    """Serializer for confirming account recovery and choosing new auth method."""

    token = serializers.CharField()
    new_auth_method = serializers.ChoiceField(choices=['password', 'passkey'])
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        new_auth_method = attrs.get('new_auth_method')
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        if new_auth_method == 'password':
            if not password:
                raise serializers.ValidationError({
                    'password': 'Password is required when choosing password authentication.'
                })
            if password != password_confirm:
                raise serializers.ValidationError({
                    'password_confirm': 'Passwords do not match.'
                })

        attrs.pop('password_confirm', None)
        return attrs


class PasskeyCredentialSerializer(serializers.Serializer):
    """Serializer for passkey credential enrollment."""

    credential_response = serializers.JSONField()


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing user password."""

    old_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')
        old_password = attrs.get('old_password')

        # Check that new passwords match
        if new_password != new_password_confirm:
            raise serializers.ValidationError({
                'new_password_confirm': 'New passwords do not match.'
            })

        # Check that new password is different from old password
        if old_password == new_password:
            raise serializers.ValidationError({
                'new_password': 'New password must be different from the old password.'
            })

        # Remove confirmation field before returning
        attrs.pop('new_password_confirm', None)
        return attrs
