import { apiClient } from './client';
import type { Skill, CreateSkillRequest, UpdateSkillRequest } from '../types/api';

export const skillsApi = {
  async list(): Promise<Skill[]> {
    return apiClient.get<Skill[]>('/api/skills');
  },

  async getById(id: number): Promise<Skill> {
    return apiClient.get<Skill>(`/api/skills/${id}`);
  },

  async create(data: CreateSkillRequest): Promise<Skill> {
    return apiClient.post<Skill>('/api/skills', data);
  },

  async update(id: number, data: UpdateSkillRequest): Promise<Skill> {
    return apiClient.patch<Skill>(`/api/skills/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/skills/${id}`);
  }
};
