// User and Authentication Types
export interface User {
  id: string;
  email: string;
  auth_method: 'password' | 'passkey';
  totp_enabled: boolean;
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  age?: number;
  birthday?: string;
  avatar_style?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  age?: number;
  birthday?: string;
  avatar_style?: string;
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface RegisterData {
  email: string;
  auth_method: 'password' | 'passkey';
  password?: string;
  password_confirm?: string;
}

export interface LoginData {
  email: string;
  password: string;
  totp_code?: string;
}

export interface RecoveryRequestData {
  email: string;
}

export interface RecoveryConfirmData {
  token: string;
  new_auth_method: 'password' | 'passkey';
  password?: string;
  password_confirm?: string;
}

// Todo Types
export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoCreateData {
  title: string;
  description?: string;
  priority?: number;
  due_date?: string | null;
}

export interface TodoUpdateData {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  due_date?: string | null;
}

export interface TodoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Todo[];
}

// API Error Response
export interface ApiError {
  error?: string;
  detail?: string;
  [key: string]: any;
}
