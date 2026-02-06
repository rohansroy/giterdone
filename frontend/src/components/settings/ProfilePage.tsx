import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { getAvatarUrl, AVATAR_STYLES } from '../../utils/avatar';
import { AxiosError } from 'axios';
import type { ApiError } from '../../types';

const ProfilePage: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [avatarStyle, setAvatarStyle] = useState(user?.avatar_style || 'initials');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const data = {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        age: age ? parseInt(age) : undefined,
        birthday: birthday || undefined,
        avatar_style: avatarStyle,
      };

      await authAPI.updateProfile(data);
      await checkAuth(); // Refresh user data
      setSuccess('Profile updated successfully!');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Profile Settings</h1>
          <p className="text-neutral-600">Manage your personal information and avatar</p>
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

        {/* Avatar Preview */}
        <div className="card-soft mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Avatar Preview</h2>
          <div className="flex items-center gap-6">
            <img
              src={getAvatarUrl({ ...user, avatar_style: avatarStyle, first_name: firstName, last_name: lastName }, 80)}
              alt="Avatar preview"
              className="w-20 h-20 rounded-full border-2 border-neutral-200"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">{firstName || lastName ? `${firstName} ${lastName}`.trim() : user.email}</p>
              <p className="text-xs text-neutral-500 mt-1">Your avatar is generated based on your profile</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="card-soft">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Personal Information</h2>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-neutral-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-soft"
                  placeholder="John"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-neutral-700 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-soft"
                  placeholder="Doe"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="age" className="block text-xs font-semibold text-neutral-700 mb-2">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  min="1"
                  max="150"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="input-soft"
                  placeholder="25"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="birthday" className="block text-xs font-semibold text-neutral-700 mb-2">
                  Birthday
                </label>
                <input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="input-soft"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="avatarStyle" className="block text-xs font-semibold text-neutral-700 mb-2">
                Avatar Style
              </label>
              <select
                id="avatarStyle"
                value={avatarStyle}
                onChange={(e) => setAvatarStyle(e.target.value)}
                className="input-soft"
                disabled={isLoading}
              >
                {AVATAR_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-neutral-500">Choose how your avatar is displayed</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-neutral-200">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Account Information */}
        <div className="card-soft mt-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-200">
              <span className="text-sm font-medium text-neutral-600">Email</span>
              <span className="text-sm text-neutral-900">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-200">
              <span className="text-sm font-medium text-neutral-600">Member Since</span>
              <span className="text-sm text-neutral-900">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
