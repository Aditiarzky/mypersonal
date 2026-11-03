export interface SocialLink {
  id: number;
  profileId: number;
  platform: string;
  url: string;
}

export interface CreateSocialLinkInput {
  profileId: number;
  platform: string;
  url: string;
}

export type UpdateSocialLinkInput = Partial<CreateSocialLinkInput>;
