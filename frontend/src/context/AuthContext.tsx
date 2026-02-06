import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import type { User, LoginData, RegisterData, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<LoginResponse>;
  registerWithPasskey: (email: string, credentialResponse: any) => Promise<LoginResponse>;
  loginWithPasskey: (email: string, credentialResponse: any) => Promise<LoginResponse>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (data: LoginData): Promise<LoginResponse> => {
    const response = await authAPI.login(data);

    // Store tokens
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);

    // Set user
    setUser(response.user);

    return response;
  };

  const register = async (data: RegisterData): Promise<LoginResponse> => {
    const response = await authAPI.register(data);

    // Store tokens
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);

    // Set user
    setUser(response.user);

    return response;
  };

  const registerWithPasskey = async (email: string, credentialResponse: any): Promise<LoginResponse> => {
    const response = await authAPI.verifyPasskeyRegistration(email, credentialResponse);

    // Store tokens
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);

    // Set user
    setUser(response.user);

    return response;
  };

  const loginWithPasskey = async (email: string, credentialResponse: any): Promise<LoginResponse> => {
    const response = await authAPI.verifyPasskeyLogin(email, credentialResponse);

    // Store tokens
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);

    // Set user
    setUser(response.user);

    return response;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    registerWithPasskey,
    loginWithPasskey,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
