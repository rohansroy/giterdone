import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-soft">
      <div className="container mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 text-2xl font-bold text-neutral-900 hover:text-primary-600 transition-smooth tracking-tight group"
        >
          {/* Logo Icon */}
          <div className="relative">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-smooth"
            >
              {/* Outer circle with gradient */}
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="url(#gradient)"
                className="group-hover:opacity-90 transition-smooth"
              />
              {/* Checkmark */}
              <path
                d="M11 18L15.5 23L25 13"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:stroke-neutral-50 transition-smooth"
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient
                  id="gradient"
                  x1="2"
                  y1="2"
                  x2="34"
                  y2="34"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span>Giterdone</span>
        </Link>

        <nav className="flex items-center gap-8">
          {isAuthenticated ? (
            <>
              <Link
                to="/todos"
                className="text-neutral-700 hover:text-primary-600 transition-smooth font-medium"
              >
                My Todos
              </Link>

              {/* User Dropdown Menu */}
              <div
                className="relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <button className="flex items-center gap-2 text-sm text-neutral-700 hover:text-primary-600 transition-smooth font-medium px-3 py-2 rounded-lg hover:bg-neutral-50">
                  {user && (
                    <img
                      src={getAvatarUrl(user, 32)}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border-2 border-neutral-200"
                    />
                  )}
                  <span className="hidden sm:inline">{user?.email}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full pt-2 w-56 z-50">
                    <div className="bg-white rounded-xl shadow-soft border border-neutral-200 py-2 animate-slide-down">
                    <div className="px-4 py-3 border-b border-neutral-200">
                      <div className="flex items-center gap-3">
                        {user && (
                          <img
                            src={getAvatarUrl(user, 40)}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full border-2 border-neutral-200"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-neutral-500">Signed in as</p>
                          <p className="text-sm font-medium text-neutral-900 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center justify-start gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-smooth"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="leading-none">Profile</span>
                    </Link>

                    <Link
                      to="/security"
                      className="flex items-center justify-start gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-smooth"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="leading-none">Security Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-start gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-soft-red transition-smooth border-t border-neutral-200 mt-2 pt-2"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="leading-none">Logout</span>
                    </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-neutral-700 hover:text-primary-600 transition-smooth font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-smooth font-medium shadow-soft hover:shadow-soft-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
