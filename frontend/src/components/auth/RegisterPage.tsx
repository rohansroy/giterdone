import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable, startRegistration } from '../../services/webauthn';
import type { ApiError } from '../../types';
import { AxiosError } from 'axios';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'passkey'>('password');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false);

  const { register, registerWithPasskey } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check WebAuthn support on mount
    setWebAuthnSupported(isWebAuthnSupported());
    isPlatformAuthenticatorAvailable().then(setPlatformAuthAvailable);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (authMethod === 'password') {
      // Password validation
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (password !== passwordConfirm) {
        setError('Passwords do not match');
        return;
      }
    } else if (authMethod === 'passkey') {
      // Check WebAuthn support
      if (!webAuthnSupported) {
        setError('Your browser does not support passkeys. Please use a modern browser or choose password authentication.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMethod === 'password') {
        // Password registration
        await register({
          email,
          auth_method: authMethod,
          password,
          password_confirm: passwordConfirm,
        });
        navigate('/todos');
      } else {
        // Passkey registration
        try {
          // Step 1: Get registration options from server
          const { options } = await authAPI.getPasskeyRegistrationOptions(email);

          // Step 2: Create credential using WebAuthn API
          const credential = await startRegistration(options);

          // Step 3: Send credential to server for verification
          await registerWithPasskey(email, credential);

          navigate('/todos');
        } catch (webauthnError: any) {
          throw new Error(webauthnError.message || 'Passkey registration failed');
        }
      }
    } catch (err: any) {
      const axiosError = err as AxiosError<ApiError>;

      // Handle field-specific errors
      const errors = axiosError.response?.data;
      if (errors) {
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return messages.join(', ');
            }
            return messages;
          })
          .join('. ');
        setError(errorMessages || err.message || 'Registration failed. Please try again.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-4xl font-bold text-neutral-900 mb-3 tracking-tight">
            Get Started
          </h2>
          <p className="text-neutral-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-smooth"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="card-soft animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-soft-red/10 border border-soft-red/20 p-4">
                <p className="text-sm text-soft-red font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-800 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-soft"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-3">
                  Authentication Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-neutral-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-smooth">
                    <input
                      type="radio"
                      name="auth-method"
                      value="password"
                      checked={authMethod === 'password'}
                      onChange={() => setAuthMethod('password')}
                      className="w-5 h-5 text-primary-600 focus:ring-4 focus:ring-primary-100"
                    />
                    <span className="ml-3 text-sm font-medium text-neutral-900">
                      Password Authentication
                    </span>
                  </label>
                  <label className="flex items-center p-4 border-2 border-neutral-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-smooth">
                    <input
                      type="radio"
                      name="auth-method"
                      value="passkey"
                      checked={authMethod === 'passkey'}
                      onChange={() => setAuthMethod('passkey')}
                      className="w-5 h-5 text-primary-600 focus:ring-4 focus:ring-primary-100"
                    />
                    <span className="ml-3 text-sm font-medium text-neutral-900">
                      Passkey (WebAuthn)
                    </span>
                  </label>
                </div>
              </div>

              {authMethod === 'password' && (
                <div className="space-y-5 animate-slide-down">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-neutral-800 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-soft"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div>
                    <label htmlFor="password-confirm" className="block text-sm font-semibold text-neutral-800 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="password-confirm"
                      name="password-confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="input-soft"
                      placeholder="Re-enter your password"
                    />
                  </div>
                </div>
              )}

              {authMethod === 'passkey' && (
                <div className="space-y-3 animate-slide-down">
                  {!webAuthnSupported ? (
                    <div className="rounded-xl bg-soft-red/10 border border-soft-red/20 p-4">
                      <p className="text-sm text-soft-red font-medium leading-relaxed">
                        ⚠️ Your browser does not support passkeys. Please use a modern browser (Chrome, Safari, Edge, or Firefox) or choose password authentication.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-soft-blue/10 border border-soft-blue/20 p-4">
                      <p className="text-sm text-soft-blue leading-relaxed">
                        {platformAuthAvailable
                          ? "✓ You'll be prompted to create a passkey using your device's biometric authentication (Touch ID, Face ID, or Windows Hello) or a security key."
                          : "You'll be prompted to use a security key (YubiKey, etc.) to create your passkey."
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
