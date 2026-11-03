import { apiClient } from './client';
import type { SocialLink, CreateSocialLinkRequest, UpdateSocialLinkRequest } from '../types/api';

export const socialLinksApi = {
  async list(): Promise<SocialLink[]> {
    return apiClient.get<SocialLink[]>('/api/social-links');
  },

  async getById(id: number): Promise<SocialLink> {
    return apiClient.get<SocialLink>(`/api/social-links/${id}`);
  },

  async create(data: CreateSocialLinkRequest): Promise<SocialLink> {
    return apiClient.post<SocialLink>('/api/social-links', data);
  },

  async update(id: number, data: UpdateSocialLinkRequest): Promise<SocialLink> {
    return apiClient.patch<SocialLink>(`/api/social-links/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/social-links/${id}`);
  }
};
