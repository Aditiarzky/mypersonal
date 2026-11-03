import { apiClient } from './client';
import type { Experience, CreateExperienceRequest, UpdateExperienceRequest } from '../types/api';

export const experiencesApi = {
  async list(): Promise<Experience[]> {
    return apiClient.get<Experience[]>('/api/experiences');
  },

  async getById(id: number): Promise<Experience> {
    return apiClient.get<Experience>(`/api/experiences/${id}`);
  },

  async create(data: CreateExperienceRequest): Promise<Experience> {
    return apiClient.post<Experience>('/api/experiences', data);
  },

  async update(id: number, data: UpdateExperienceRequest): Promise<Experience> {
    return apiClient.patch<Experience>(`/api/experiences/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/experiences/${id}`);
  }
};
