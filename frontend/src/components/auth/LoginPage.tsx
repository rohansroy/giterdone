import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { startAuthentication } from '../../services/webauthn';
import type { ApiError } from '../../types';
import { AxiosError } from 'axios';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'passkey' | null>(null);
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [showTotpInput, setShowTotpInput] = useState(false);
  const [error, setError] = useState('');
  const [totpInfo, setTotpInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  const { login, loginWithPasskey } = useAuth();
  const navigate = useNavigate();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setCheckingAuth(true);
    setError('');

    try {
      const { auth_method } = await authAPI.checkAuthMethod(email);
      setAuthMethod(auth_method as 'password' | 'passkey' | null);

      // If it's a passkey account, trigger passkey login immediately
      if (auth_method === 'passkey') {
        await handlePasskeyLogin();
      } else {
        // Show password field for password or unknown auth method
        setShowPasswordStep(true);
      }
    } catch (err) {
      // If user doesn't exist, still show password field
      console.error('Failed to check auth method:', err);
      setShowPasswordStep(true);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      // Get passkey login options
      const { options } = await authAPI.getPasskeyLoginOptions(email);

      // Start passkey authentication
      const credential = await startAuthentication(options);

      // Verify with backend
      await loginWithPasskey(email, credential);

      navigate('/todos');
    } catch (err: any) {
      setError(err.message || 'Passkey authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTotpInfo('');
    setIsLoading(true);

    try {
      await login({
        email,
        password,
        totp_code: totpCode || undefined,
      });
      navigate('/todos');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;

      if (axiosError.response?.data?.totp_required) {
        setShowTotpInput(true);
        setTotpInfo('Two-factor authentication is enabled on your account');
      } else {
        setError(
          axiosError.response?.data?.error ||
          axiosError.response?.data?.detail ||
          'Login failed. Please check your credentials.'
        );
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
            Welcome Back
          </h2>
          <p className="text-neutral-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-smooth"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="card-soft animate-slide-up">
          {!showPasswordStep ? (
            // Step 1: Email input
            <form className="space-y-6" onSubmit={handleContinue}>
              {error && (
                <div className="rounded-xl bg-soft-red/10 border border-soft-red/20 p-4">
                  <p className="text-sm text-soft-red font-medium">{error}</p>
                </div>
              )}

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
                  disabled={isLoading || checkingAuth}
                  autoFocus
                />
                {checkingAuth && (
                  <p className="mt-2 text-xs text-neutral-500">Checking authentication method...</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || checkingAuth}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingAuth ? 'Checking...' : 'Continue'}
              </button>
            </form>
          ) : showTotpInput ? (
            // Step 3: 2FA input only
            <form className="space-y-6" onSubmit={handlePasswordLogin}>
              {error && (
                <div className="rounded-xl bg-soft-red/10 border border-soft-red/20 p-4">
                  <p className="text-sm text-soft-red font-medium">{error}</p>
                </div>
              )}

              {totpInfo && (
                <div className="rounded-xl bg-primary-50 border border-primary-200 p-4">
                  <p className="text-sm text-primary-700 font-medium">{totpInfo}</p>
                </div>
              )}

              <div>
                <label htmlFor="totp-code" className="block text-sm font-semibold text-neutral-800 mb-2">
                  Two-Factor Authentication
                </label>
                <input
                  id="totp-code"
                  name="totp-code"
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="input-soft text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="mt-2 text-xs text-neutral-500">Enter the 6-digit code from your authenticator app</p>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordStep(false);
                    setAuthMethod(null);
                    setPassword('');
                    setTotpCode('');
                    setShowTotpInput(false);
                    setError('');
                    setTotpInfo('');
                  }}
                  className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-smooth"
                >
                  ← Start over
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || totpCode.length !== 6}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify and Sign In'}
              </button>
            </form>
          ) : (
            // Step 2: Password input
            <form className="space-y-6" onSubmit={handlePasswordLogin}>
              {error && (
                <div className="rounded-xl bg-soft-red/10 border border-soft-red/20 p-4">
                  <p className="text-sm text-soft-red font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="email-display" className="block text-sm font-semibold text-neutral-800 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="email-display"
                      type="email"
                      value={email}
                      disabled
                      className="input-soft opacity-60 cursor-not-allowed flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordStep(false);
                        setAuthMethod(null);
                        setPassword('');
                        setTotpCode('');
                        setShowTotpInput(false);
                        setError('');
                        setTotpInfo('');
                      }}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-smooth whitespace-nowrap"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="animate-slide-down">
                  <label htmlFor="password" className="block text-sm font-semibold text-neutral-800 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-soft"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  to="/recovery"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-smooth"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
