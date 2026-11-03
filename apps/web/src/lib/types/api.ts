// API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  [key: string]: unknown;
}

// User & Auth
export interface User {
  id: number;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SessionResponse {
  user: User;
}

// Skill
export interface Skill {
  id: number;
  name: string;
  category: string;
  iconUrl: string | null;
}

export interface CreateSkillRequest {
  name: string;
  category: string;
  iconUrl?: string | null;
}

export interface UpdateSkillRequest {
  name?: string;
  category?: string;
  iconUrl?: string | null;
}

// Project
export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  images: string[] | null;
  demoUrl: string | null;
  sourceCodeUrl: string | null;
  orderPosition: number;
  createdAt: string;
  skills: Skill[];
}

export interface CreateProjectRequest {
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  images?: string[] | null;
  demoUrl?: string | null;
  sourceCodeUrl?: string | null;
  orderPosition?: number;
  skillIds?: number[];
}

export interface UpdateProjectRequest {
  title?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string | null;
  images?: string[] | null;
  demoUrl?: string | null;
  sourceCodeUrl?: string | null;
  orderPosition?: number;
  skillIds?: number[];
}

// Profile
export interface SocialLink {
  id: number;
  profileId: number;
  platform: string;
  url: string;
}

export interface Profile {
  id: number;
  userId: number;
  title: string;
  bio: string;
  avatarUrl: string | null;
  cvUrl: string | null;
  location: string | null;
  socialLinks: SocialLink[];
}

export interface CreateProfileRequest {
  userId: number;
  title: string;
  bio: string;
  avatarUrl?: string | null;
  cvUrl?: string | null;
  location?: string | null;
}

export interface UpdateProfileRequest {
  title?: string;
  bio?: string;
  avatarUrl?: string | null;
  cvUrl?: string | null;
  location?: string | null;
}

// Social Link
export interface CreateSocialLinkRequest {
  profileId: number;
  platform: string;
  url: string;
}

export interface UpdateSocialLinkRequest {
  platform?: string;
  url?: string;
}

// Experience
export interface Experience {
  id: number;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export interface CreateExperienceRequest {
  companyName: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
}

export interface UpdateExperienceRequest {
  companyName?: string;
  role?: string;
  startDate?: string;
  endDate?: string | null;
  description?: string | null;
}

// Project Skill
export interface AddProjectSkillRequest {
  skillId: number;
}
