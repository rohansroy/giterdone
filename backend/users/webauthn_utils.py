"""
WebAuthn utilities for passkey authentication.
Handles credential registration and authentication using the webauthn library.
"""

import secrets
import json
from typing import Dict, Any, Optional
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers import (
    base64url_to_bytes,
    bytes_to_base64url,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    AuthenticatorAttachment,
)
from django.conf import settings


def generate_challenge() -> bytes:
    """Generate a cryptographically secure random challenge."""
    return secrets.token_bytes(32)


def generate_passkey_registration_options(
    user_id: str,
    user_email: str,
    user_display_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate WebAuthn registration options for passkey creation.

    Args:
        user_id: Unique user identifier (UUID as string)
        user_email: User's email address
        user_display_name: Display name for the user (defaults to email)

    Returns:
        Dictionary with registration options to send to client
    """
    if user_display_name is None:
        user_display_name = user_email

    # Generate registration options
    options = generate_registration_options(
        rp_id=settings.WEBAUTHN_RP_ID,
        rp_name=settings.WEBAUTHN_RP_NAME,
        user_id=user_id.encode('utf-8'),
        user_name=user_email,
        user_display_name=user_display_name,
        # Allow both platform and cross-platform authenticators
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
            # authenticator_attachment=None allows both platform and cross-platform
        ),
    )

    # Convert to JSON-serializable format
    options_json = options_to_json(options)

    return {
        'options': json.loads(options_json),
        'challenge': bytes_to_base64url(options.challenge),
    }


def verify_passkey_registration(
    credential_response: Dict[str, Any],
    expected_challenge: bytes,
    expected_origin: str,
    expected_rp_id: str,
) -> Dict[str, Any]:
    """
    Verify a passkey registration response from the client.

    Args:
        credential_response: The credential creation response from browser
        expected_challenge: The challenge that was sent to the client
        expected_origin: Expected origin (e.g., "http://localhost:5173")
        expected_rp_id: Expected Relying Party ID (e.g., "localhost")

    Returns:
        Dictionary containing verified credential data

    Raises:
        Exception: If verification fails
    """
    verification = verify_registration_response(
        credential=credential_response,
        expected_challenge=expected_challenge,
        expected_origin=expected_origin,
        expected_rp_id=expected_rp_id,
    )

    # Extract and return credential data for storage
    # Note: credential_id and credential_public_key are bytes, others are already in usable format
    return {
        'credential_id': bytes_to_base64url(verification.credential_id),
        'public_key': bytes_to_base64url(verification.credential_public_key),
        'sign_count': verification.sign_count,
        'aaguid': verification.aaguid,  # Already a string
        'fmt': verification.fmt,
        'credential_type': verification.credential_type,
        'user_verified': verification.user_verified,
        'credential_backed_up': verification.credential_backed_up,
        'credential_device_type': verification.credential_device_type,
    }


def generate_passkey_authentication_options(
    user_credentials: Optional[list] = None,
) -> Dict[str, Any]:
    """
    Generate WebAuthn authentication options for passkey login.

    Args:
        user_credentials: List of credential descriptors for the user
                         Each should have 'credential_id' and optional 'transports'

    Returns:
        Dictionary with authentication options to send to client
    """
    # Convert stored credentials to PublicKeyCredentialDescriptor format
    allowed_credentials = []
    if user_credentials:
        for cred in user_credentials:
            credential_id_bytes = base64url_to_bytes(cred['credential_id'])
            allowed_credentials.append(
                PublicKeyCredentialDescriptor(
                    id=credential_id_bytes,
                    transports=cred.get('transports', []),
                )
            )

    # Generate authentication options
    options = generate_authentication_options(
        rp_id=settings.WEBAUTHN_RP_ID,
        allow_credentials=allowed_credentials if allowed_credentials else None,
        user_verification=UserVerificationRequirement.PREFERRED,
    )

    # Convert to JSON-serializable format
    options_json = options_to_json(options)

    return {
        'options': json.loads(options_json),
        'challenge': bytes_to_base64url(options.challenge),
    }


def verify_passkey_authentication(
    credential_response: Dict[str, Any],
    expected_challenge: bytes,
    expected_origin: str,
    expected_rp_id: str,
    credential_public_key: bytes,
    credential_current_sign_count: int,
) -> Dict[str, Any]:
    """
    Verify a passkey authentication response from the client.

    Args:
        credential_response: The credential assertion response from browser
        expected_challenge: The challenge that was sent to the client
        expected_origin: Expected origin (e.g., "http://localhost:5173")
        expected_rp_id: Expected Relying Party ID (e.g., "localhost")
        credential_public_key: The stored public key for this credential
        credential_current_sign_count: Current sign count for replay protection

    Returns:
        Dictionary with new sign count and verification status

    Raises:
        Exception: If verification fails
    """
    verification = verify_authentication_response(
        credential=credential_response,
        expected_challenge=expected_challenge,
        expected_origin=expected_origin,
        expected_rp_id=expected_rp_id,
        credential_public_key=credential_public_key,
        credential_current_sign_count=credential_current_sign_count,
        require_user_verification=False,  # PREFERRED, not required
    )

    return {
        'verified': True,
        'new_sign_count': verification.new_sign_count,
        'credential_id': bytes_to_base64url(verification.credential_id),
        'user_verified': verification.user_verified,
        'credential_backed_up': verification.credential_backed_up,
        'credential_device_type': verification.credential_device_type,
    }


def prepare_credential_for_storage(verified_credential: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare verified credential data for database storage.

    Args:
        verified_credential: The verified credential data from registration

    Returns:
        Dictionary ready for JSON storage in database
    """
    return {
        'credential_id': verified_credential['credential_id'],
        'public_key': verified_credential['public_key'],
        'sign_count': verified_credential['sign_count'],
        'aaguid': verified_credential['aaguid'],
        'fmt': verified_credential['fmt'],
        'credential_type': verified_credential['credential_type'],
        'user_verified': verified_credential['user_verified'],
        'credential_backed_up': verified_credential['credential_backed_up'],
        'credential_device_type': verified_credential['credential_device_type'],
    }
