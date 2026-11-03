import type { CreateSocialLinkInput, SocialLink, UpdateSocialLinkInput } from '../../domain/social-links/social-link';
import type { SocialLinkRepository } from '../../domain/social-links/social-link-repository';

export class SocialLinkService {
  constructor(private readonly links: SocialLinkRepository) {}
  list(): Promise<SocialLink[]> { return this.links.list(); }
  findById(id: number): Promise<SocialLink | null> { return this.links.findById(id); }
  create(input: CreateSocialLinkInput): Promise<SocialLink> { return this.links.create(input); }
  update(id: number, input: UpdateSocialLinkInput): Promise<SocialLink | null> { return this.links.update(id, input); }
  delete(id: number): Promise<boolean> { return this.links.delete(id); }
}
