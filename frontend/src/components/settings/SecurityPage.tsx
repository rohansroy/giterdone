import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { AxiosError } from 'axios';
import type { ApiError } from '../../types';

const SecurityPage: React.FC = () => {
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setTotpEnabled(user.totp_enabled || false);
    }
  }, [user]);

  const handleEnrollStart = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.enrollTOTP();
      setQrCode(response.qr_code);
      setTotpSecret(response.secret);
      setShowEnrollment(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.error || 'Failed to generate TOTP secret');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authAPI.verifyTOTP(verificationCode);
      setSuccess('Two-factor authentication enabled successfully!');
      setShowEnrollment(false);
      setVerificationCode('');
      setTotpEnabled(true);
      await checkAuth(); // Refresh user data
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.error || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authAPI.disableTOTP(disableCode);
      setSuccess('Two-factor authentication disabled successfully');
      setShowDisable(false);
      setDisableCode('');
      setTotpEnabled(false);
      await checkAuth(); // Refresh user data
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.error || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEnrollment = () => {
    setShowEnrollment(false);
    setQrCode('');
    setTotpSecret('');
    setVerificationCode('');
    setError('');
  };

  // Password validation helpers
  const validatePasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 16,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbersAndSymbols: /[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const passwordRequirements = validatePasswordRequirements(newPassword);
  const allRequirementsMet = Object.values(passwordRequirements).every(req => req);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setPasswordChangeLoading(false);
      return;
    }

    // Validate all requirements are met
    if (!allRequirementsMet) {
      setError('New password does not meet all requirements.');
      setPasswordChangeLoading(false);
      return;
    }

    try {
      const response = await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });

      setSuccess('Password changed successfully. Please log in again with your new password to confirm it works.');
      setShowPasswordChange(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Logout after 3 seconds
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 3000);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const cancelPasswordChange = () => {
    setShowPasswordChange(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Security Settings</h1>
          <p className="text-neutral-600">Manage your account security and authentication methods</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-soft-red/10 border border-soft-red/20 p-4 animate-slide-down">
            <p className="text-sm text-soft-red font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-soft-green/10 border border-soft-green/20 p-4 animate-slide-down">
            <p className="text-sm text-soft-green font-medium">{success}</p>
          </div>
        )}

        {/* Two-Factor Authentication Section */}
        <div className="card-soft mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Two-Factor Authentication (2FA)
              </h2>
              <p className="text-sm text-neutral-600">
                Add an extra layer of security to your account using a time-based one-time password (TOTP)
              </p>
            </div>
            <div className="ml-4">
              {totpEnabled ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-soft-green/20 text-soft-green">
                  ✓ Enabled
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-200 text-neutral-700">
                  Disabled
                </span>
              )}
            </div>
          </div>

          {!totpEnabled && !showEnrollment && (
            <div>
              <p className="text-sm text-neutral-600 mb-4">
                Protect your account with TOTP two-factor authentication. You'll need an authenticator app like:
              </p>
              <ul className="text-sm text-neutral-600 mb-6 ml-4 space-y-1">
                <li>• Google Authenticator</li>
                <li>• Microsoft Authenticator</li>
                <li>• Authy</li>
                <li>• 1Password</li>
                <li>• Bitwarden</li>
              </ul>
              <button
                onClick={handleEnrollStart}
                disabled={isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enable Two-Factor Authentication
              </button>
            </div>
          )}

          {showEnrollment && (
            <div className="animate-slide-down">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Step 1: Scan QR Code</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Scan this QR code with your authenticator app:
                </p>
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="TOTP QR Code" className="w-64 h-64 border-2 border-neutral-200 rounded-xl" />
                </div>
                <div className="bg-neutral-100 rounded-xl p-4">
                  <p className="text-xs text-neutral-600 mb-2">Or enter this secret manually:</p>
                  <code className="text-sm font-mono text-neutral-900 break-all">{totpSecret}</code>
                </div>
              </div>

              <form onSubmit={handleEnrollVerify}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">Step 2: Verify</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Enter the 6-digit code from your authenticator app:
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="input-soft max-w-xs"
                    placeholder="000000"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify and Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEnrollment}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-xl border-2 border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-smooth disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {totpEnabled && !showDisable && (
            <div>
              <p className="text-sm text-neutral-600 mb-6">
                Two-factor authentication is currently enabled. You'll need to enter a code from your authenticator app when signing in.
              </p>
              <button
                onClick={() => setShowDisable(true)}
                className="px-6 py-3 rounded-xl border-2 border-soft-red text-soft-red font-medium hover:bg-soft-red/10 transition-smooth"
              >
                Disable Two-Factor Authentication
              </button>
            </div>
          )}

          {showDisable && (
            <div className="animate-slide-down">
              <form onSubmit={handleDisable}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">Disable 2FA</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Enter a code from your authenticator app to confirm:
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    className="input-soft max-w-xs"
                    placeholder="000000"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || disableCode.length !== 6}
                    className="px-6 py-3 rounded-xl border-2 border-soft-red text-soft-red font-medium hover:bg-soft-red/10 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Disabling...' : 'Confirm Disable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisable(false);
                      setDisableCode('');
                      setError('');
                    }}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-xl border-2 border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-smooth disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Password Change Section - Only for password users */}
        {user?.auth_method === 'password' && (
          <div className="card-soft mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                  Change Password
                </h2>
                <p className="text-sm text-neutral-600">
                  Update your account password to keep your account secure
                </p>
              </div>
            </div>

            {!showPasswordChange && (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="btn-primary"
              >
                Change Password
              </button>
            )}

            {showPasswordChange && (
              <div className="animate-slide-down">
                <form onSubmit={handlePasswordChange}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="input-soft"
                      placeholder="Enter your current password"
                      disabled={passwordChangeLoading}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-soft"
                      placeholder="Enter your new password"
                      disabled={passwordChangeLoading}
                      required
                    />
                  </div>

                  {/* Password Requirements */}
                  <div className="mb-6 ml-4 space-y-2">
                    <div className={`flex items-center text-sm ${passwordRequirements.minLength ? 'text-soft-green' : 'text-neutral-400'}`}>
                      {passwordRequirements.minLength ? (
                        <span className="mr-2">✓</span>
                      ) : (
                        <span className="mr-2">○</span>
                      )}
                      <span>At least 16 characters long</span>
                    </div>
                    <div className={`flex items-center text-sm ${passwordRequirements.hasUppercase ? 'text-soft-green' : 'text-neutral-400'}`}>
                      {passwordRequirements.hasUppercase ? (
                        <span className="mr-2">✓</span>
                      ) : (
                        <span className="mr-2">○</span>
                      )}
                      <span>Contains uppercase letter</span>
                    </div>
                    <div className={`flex items-center text-sm ${passwordRequirements.hasLowercase ? 'text-soft-green' : 'text-neutral-400'}`}>
                      {passwordRequirements.hasLowercase ? (
                        <span className="mr-2">✓</span>
                      ) : (
                        <span className="mr-2">○</span>
                      )}
                      <span>Contains lowercase letter</span>
                    </div>
                    <div className={`flex items-center text-sm ${passwordRequirements.hasNumbersAndSymbols ? 'text-soft-green' : 'text-neutral-400'}`}>
                      {passwordRequirements.hasNumbersAndSymbols ? (
                        <span className="mr-2">✓</span>
                      ) : (
                        <span className="mr-2">○</span>
                      )}
                      <span>Contains numbers and symbols</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-soft"
                      placeholder="Confirm your new password"
                      disabled={passwordChangeLoading}
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={passwordChangeLoading || !oldPassword || !newPassword || !confirmPassword || !allRequirementsMet}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordChangeLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelPasswordChange}
                      disabled={passwordChangeLoading}
                      className="px-6 py-3 rounded-xl border-2 border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-smooth disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Account Information */}
        <div className="card-soft">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-200">
              <span className="text-sm font-medium text-neutral-600">Email</span>
              <span className="text-sm text-neutral-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-200">
              <span className="text-sm font-medium text-neutral-600">Authentication Method</span>
              <span className="text-sm text-neutral-900 capitalize">{user?.auth_method}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm font-medium text-neutral-600">Two-Factor Authentication</span>
              <span className="text-sm text-neutral-900">{totpEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
