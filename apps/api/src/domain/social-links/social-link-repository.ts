import type { CreateSocialLinkInput, SocialLink, UpdateSocialLinkInput } from './social-link';

export interface SocialLinkRepository {
  list(): Promise<SocialLink[]>;
  findById(id: number): Promise<SocialLink | null>;
  create(input: CreateSocialLinkInput): Promise<SocialLink>;
  update(id: number, input: UpdateSocialLinkInput): Promise<SocialLink | null>;
  delete(id: number): Promise<boolean>;
}

export class SocialLinkProfileNotFoundError extends Error {
  constructor() { super('Social link profile does not exist.'); }
}
