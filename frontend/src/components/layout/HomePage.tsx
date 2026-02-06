import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-24 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold text-neutral-900 mb-8 tracking-tight">
            Giterdone
          </h1>
          <p className="text-2xl md:text-3xl text-neutral-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            A thoughtfully designed todo app that helps you focus on what matters most
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-8">
            {isAuthenticated ? (
              <Link
                to="/todos"
                className="btn-primary text-lg px-10 py-4 animate-slide-up"
              >
                Go to My Todos
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn-primary text-lg px-10 py-4 animate-slide-up"
                  style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary text-lg px-10 py-4 animate-slide-up"
                  style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {!isAuthenticated && (
            <p className="text-sm text-neutral-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              No credit card required • Free forever
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="card-soft text-center animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Simple & Clean</h3>
            <p className="text-neutral-600 leading-relaxed">
              Focus on what matters with a beautifully minimal, distraction-free interface
            </p>
          </div>

          <div className="card-soft text-center animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
            <div className="w-14 h-14 bg-soft-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-soft-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Secure by Default</h3>
            <p className="text-neutral-600 leading-relaxed">
              Your data is protected with modern authentication including passkeys and 2FA
            </p>
          </div>

          <div className="card-soft text-center animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}>
            <div className="w-14 h-14 bg-soft-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-soft-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Priority-Focused</h3>
            <p className="text-neutral-600 leading-relaxed">
              Organize tasks by priority and due date to tackle what's most important first
            </p>
          </div>
        </div>

        {/* Subtle Badge */}
        <div className="text-center mt-24 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <p className="text-sm text-neutral-400 tracking-wide uppercase">
            Built with care for productivity
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
