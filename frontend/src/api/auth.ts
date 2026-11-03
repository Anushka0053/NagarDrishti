import { apiClient } from './client';
import { AuthUser, LoginResponse } from '../types';

export const authApi = {
  login: async (email: string, role?: string, password: string = 'demo123'): Promise<LoginResponse> => {
    const res = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role, password }),
    });
    if (res.access_token) {
      localStorage.setItem('nd_auth_token', res.access_token);
      localStorage.setItem('nd_auth_role', res.user.role);
      localStorage.setItem('nd_auth_user', JSON.stringify(res.user));
    }
    return res;
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    return apiClient<AuthUser>('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('nd_auth_token');
    localStorage.removeItem('nd_auth_role');
    localStorage.removeItem('nd_auth_user');
  },

  getStoredUser: (): AuthUser | null => {
    try {
      const data = localStorage.getItem('nd_auth_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getStoredToken: (): string | null => {
    return localStorage.getItem('nd_auth_token');
  },

  getStoredRole: (): string | null => {
    return localStorage.getItem('nd_auth_role');
  },
};

