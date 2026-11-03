import { apiClient } from './client';
import type { Profile, CreateProfileRequest, UpdateProfileRequest } from '../types/api';

export const profilesApi = {
  async list(): Promise<Profile[]> {
    return apiClient.get<Profile[]>('/api/profiles');
  },

  async getById(id: number): Promise<Profile> {
    return apiClient.get<Profile>(`/api/profiles/${id}`);
  },

  async create(data: CreateProfileRequest): Promise<Profile> {
    return apiClient.post<Profile>('/api/profiles', data);
  },

  async update(id: number, data: UpdateProfileRequest): Promise<Profile> {
    return apiClient.patch<Profile>(`/api/profiles/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/profiles/${id}`);
  }
};
