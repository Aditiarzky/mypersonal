export interface SocialLinkSummary {
  id: number;
  platform: string;
  url: string;
}

export interface Profile {
  id: number;
  userId: number;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string | null;
  cvUrl: string | null;
  location: string | null;
  socialLinks: SocialLinkSummary[];
}

export interface CreateProfileInput {
  userId: number;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string | null;
  cvUrl: string | null;
  location: string | null;
}

export type UpdateProfileInput = Partial<CreateProfileInput>;
