import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import type { ApiError } from '../../types';
import { AxiosError } from 'axios';

const RecoveryPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'passkey'>('password');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await authAPI.requestRecovery({ email });
      setMessage(response.message);

      // In development, show the token
      if (response.token) {
        setToken(response.token);
        setStep('confirm');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.error ||
        'Recovery request failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (authMethod === 'password') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (password !== passwordConfirm) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await authAPI.confirmRecovery({
        token,
        new_auth_method: authMethod,
        ...(authMethod === 'password' && {
          password,
          password_confirm: passwordConfirm,
        }),
      });
      setMessage(response.message + ' You can now login with your new credentials.');
      setStep('request');
      setToken('');
      setPassword('');
      setPasswordConfirm('');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.error ||
        'Recovery confirmation failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-4xl font-bold text-neutral-900 mb-3 tracking-tight">
            Account Recovery
          </h2>
          <p className="text-neutral-600">
            Remember your password?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-smooth"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="card-soft animate-slide-up">
          {step === 'request' ? (
            <form className="space-y-6" onSubmit={handleRequest}>
              {message && (
                <div className="rounded-xl bg-soft-green/10 border border-soft-green/20 p-4">
                  <p className="text-sm text-soft-green font-medium">{message}</p>
                </div>
              )}

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
                />
                <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
                  We'll send you instructions to recover your account
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Recovery Link'}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleConfirm}>
              {message && (
                <div className="rounded-xl bg-soft-green/10 border border-soft-green/20 p-4">
                  <p className="text-sm text-soft-green font-medium">{message}</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-soft-red/10 border border-soft-red/20 p-4">
                  <p className="text-sm text-soft-red font-medium">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="token" className="block text-sm font-semibold text-neutral-800 mb-2">
                  Recovery Token
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="input-soft"
                  placeholder="Enter token from email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-3">
                  New Authentication Method
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
                      New Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
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
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="input-soft"
                      placeholder="Re-enter your password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Recovering Account...' : 'Recover Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryPage;
