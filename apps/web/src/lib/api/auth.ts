import { apiClient } from './client';
import type { LoginRequest, SessionResponse, User } from '../types/api';

export const authApi = {
  async login(credentials: LoginRequest): Promise<User> {
    const response = await apiClient.post<SessionResponse>('/api/auth/login', credentials);
    return response.user;
  },

  async getSession(): Promise<User> {
    const response = await apiClient.get<SessionResponse>('/api/auth/session');
    return response.user;
  },

  async logout(): Promise<void> {
    await apiClient.post<{ loggedOut: boolean }>('/api/auth/logout');
  }
};
