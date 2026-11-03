import { apiClient } from './client';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/api';

export const projectsApi = {
  async list(): Promise<Project[]> {
    return apiClient.get<Project[]>('/api/projects');
  },

  async getBySlug(slug: string): Promise<Project> {
    return apiClient.get<Project>(`/api/projects/${slug}`);
  },

  async create(data: CreateProjectRequest): Promise<Project> {
    return apiClient.post<Project>('/api/projects', data);
  },

  async update(id: number, data: UpdateProjectRequest): Promise<Project> {
    return apiClient.patch<Project>(`/api/projects/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/projects/${id}`);
  }
};
