import { apiClient } from './client';
import type { Skill, AddProjectSkillRequest } from '../types/api';

export const projectSkillsApi = {
  async listSkills(projectId: number): Promise<Skill[]> {
    return apiClient.get<Skill[]>(`/api/projects/${projectId}/skills`);
  },

  async addSkill(projectId: number, data: AddProjectSkillRequest): Promise<void> {
    return apiClient.post<void>(`/api/projects/${projectId}/skills`, data);
  },

  async removeSkill(projectId: number, skillId: number): Promise<void> {
    return apiClient.delete<void>(`/api/projects/${projectId}/skills/${skillId}`);
  }
};
