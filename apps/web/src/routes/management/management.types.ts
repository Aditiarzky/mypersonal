// Section IDs and form models shared by the management page components.
export type Section =
  | "projects"
  | "skills"
  | "profiles"
  | "socialLinks"
  | "experiences";

export interface ProjectFormData {
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  images: string;
  demoUrl: string;
  sourceCodeUrl: string;
  orderPosition: number;
  skillIds: number[];
}

export interface SkillFormData {
  name: string;
  category: string;
  iconUrl: string;
}

export interface ProfileFormData {
  title: string;
  bio: string;
  avatarUrl: string;
  cvUrl: string;
  location: string;
}

export interface SocialLinkFormData {
  profileId: string;
  platform: string;
  url: string;
}

export interface ExperienceFormData {
  companyName: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}
