import axios, { AxiosError, type AxiosInstance } from 'axios';
import type {
  User,
  LoginResponse,
  RegisterData,
  LoginData,
  RecoveryRequestData,
  RecoveryConfirmData,
  Todo,
  TodoCreateData,
  TodoUpdateData,
  TodoListResponse,
  AuthTokens,
  ProfileUpdateData,
  PasswordChangeData,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register/', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login/password/', data);
    return response.data;
  },

  checkAuthMethod: async (email: string): Promise<{ auth_method: string | null; email: string }> => {
    const response = await apiClient.post('/auth/login/check-method/', { email });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile/');
    return response.data;
  },

  requestRecovery: async (data: RecoveryRequestData): Promise<{ message: string; token?: string }> => {
    const response = await apiClient.post('/auth/recovery/request/', data);
    return response.data;
  },

  confirmRecovery: async (data: RecoveryConfirmData): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/recovery/confirm/', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  // Passkey API endpoints
  getPasskeyRegistrationOptions: async (email: string): Promise<{ options: any }> => {
    const response = await apiClient.post('/auth/passkey/registration/options/', { email });
    return response.data;
  },

  verifyPasskeyRegistration: async (email: string, credentialResponse: any): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/passkey/registration/verify/', {
      email,
      credential_response: credentialResponse,
    });
    return response.data;
  },

  getPasskeyLoginOptions: async (email: string): Promise<{ options: any }> => {
    const response = await apiClient.post('/auth/passkey/login/options/', { email });
    return response.data;
  },

  verifyPasskeyLogin: async (email: string, credentialResponse: any): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/passkey/login/verify/', {
      email,
      credential_response: credentialResponse,
    });
    return response.data;
  },

  // TOTP 2FA endpoints
  enrollTOTP: async (): Promise<{ qr_code: string; secret: string; message: string }> => {
    const response = await apiClient.post('/auth/totp/enroll/');
    return response.data;
  },

  verifyTOTP: async (code: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/totp/verify/', { code });
    return response.data;
  },

  disableTOTP: async (code: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/totp/disable/', { code });
    return response.data;
  },

  updateProfile: async (data: ProfileUpdateData): Promise<{ user: User; message: string }> => {
    const response = await apiClient.patch('/auth/profile/update/', data);
    return response.data;
  },

  changePassword: async (data: PasswordChangeData): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/password/change/', data);
    return response.data;
  },
};

// Todo API
export const todoAPI = {
  list: async (): Promise<TodoListResponse> => {
    const response = await apiClient.get<TodoListResponse>('/todos/');
    return response.data;
  },

  get: async (id: string): Promise<Todo> => {
    const response = await apiClient.get<Todo>(`/todos/${id}/`);
    return response.data;
  },

  create: async (data: TodoCreateData): Promise<Todo> => {
    const response = await apiClient.post<Todo>('/todos/', data);
    return response.data;
  },

  update: async (id: string, data: TodoUpdateData): Promise<Todo> => {
    const response = await apiClient.patch<Todo>(`/todos/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/todos/${id}/`);
    return response.data;
  },
};

export default apiClient;
