/**
 * WebAuthn service for passkey authentication
 * Provides wrapper functions for browser WebAuthn API
 */

/**
 * Convert base64url string to Uint8Array
 */
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64url string
 */
function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert ArrayBuffer to base64url string
 */
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  return uint8ArrayToBase64url(new Uint8Array(buffer));
}

/**
 * Check if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean {
  return (
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined
  );
}

/**
 * Check if platform authenticator (Touch ID, Face ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Prepare registration options from server for browser API
 */
function prepareRegistrationOptions(options: any): CredentialCreationOptions {
  return {
    publicKey: {
      ...options,
      challenge: base64urlToUint8Array(options.challenge),
      user: {
        ...options.user,
        id: base64urlToUint8Array(options.user.id),
      },
      excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
        ...cred,
        id: base64urlToUint8Array(cred.id),
      })),
    },
  };
}

/**
 * Prepare authentication options from server for browser API
 */
function prepareAuthenticationOptions(options: any): CredentialRequestOptions {
  return {
    publicKey: {
      ...options,
      challenge: base64urlToUint8Array(options.challenge),
      allowCredentials: options.allowCredentials?.map((cred: any) => ({
        ...cred,
        id: base64urlToUint8Array(cred.id),
      })),
    },
  };
}

/**
 * Convert credential response to format expected by server
 */
function prepareCredentialForServer(credential: PublicKeyCredential): any {
  const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;

  const baseCredential = {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
  };

  if (response instanceof AuthenticatorAttestationResponse) {
    // Registration response
    return {
      ...baseCredential,
      response: {
        clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
        attestationObject: arrayBufferToBase64url(response.attestationObject),
        transports: (response as any).getTransports?.() || [],
      },
    };
  } else {
    // Authentication response
    return {
      ...baseCredential,
      response: {
        clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
        authenticatorData: arrayBufferToBase64url((response as AuthenticatorAssertionResponse).authenticatorData),
        signature: arrayBufferToBase64url((response as AuthenticatorAssertionResponse).signature),
        userHandle: (response as AuthenticatorAssertionResponse).userHandle
          ? arrayBufferToBase64url((response as AuthenticatorAssertionResponse).userHandle!)
          : null,
      },
    };
  }
}

/**
 * Start passkey registration (credential creation)
 */
export async function startRegistration(options: any): Promise<any> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported by this browser');
  }

  try {
    const credentialOptions = prepareRegistrationOptions(options);
    const credential = await navigator.credentials.create(credentialOptions);

    if (!credential || credential.type !== 'public-key') {
      throw new Error('Failed to create credential');
    }

    return prepareCredentialForServer(credential as PublicKeyCredential);
  } catch (error: any) {
    // Provide user-friendly error messages
    if (error.name === 'NotAllowedError') {
      throw new Error('Registration was cancelled or timed out');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('This authenticator is already registered');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('This authenticator is not supported');
    } else {
      throw new Error(error.message || 'Registration failed');
    }
  }
}

/**
 * Start passkey authentication (credential assertion)
 */
export async function startAuthentication(options: any): Promise<any> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported by this browser');
  }

  try {
    const credentialOptions = prepareAuthenticationOptions(options);
    const credential = await navigator.credentials.get(credentialOptions);

    if (!credential || credential.type !== 'public-key') {
      throw new Error('Failed to authenticate');
    }

    return prepareCredentialForServer(credential as PublicKeyCredential);
  } catch (error: any) {
    // Provide user-friendly error messages
    if (error.name === 'NotAllowedError') {
      throw new Error('Authentication was cancelled or timed out');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('Invalid authenticator state');
    } else {
      throw new Error(error.message || 'Authentication failed');
    }
  }
}

/**
 * Get user-friendly browser/platform information
 */
export function getPlatformInfo(): {
  browser: string;
  platform: string;
  supportsWebAuthn: boolean;
} {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let platform = 'Unknown';

  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Detect platform
  if (userAgent.includes('Win')) platform = 'Windows';
  else if (userAgent.includes('Mac')) platform = 'macOS';
  else if (userAgent.includes('Linux')) platform = 'Linux';
  else if (userAgent.includes('Android')) platform = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS';

  return {
    browser,
    platform,
    supportsWebAuthn: isWebAuthnSupported(),
  };
}
