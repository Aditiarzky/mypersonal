import type { CreateSocialLinkInput, SocialLink, UpdateSocialLinkInput } from '../../domain/social-links/social-link';
import { SocialLinkProfileNotFoundError } from '../../domain/social-links/social-link-repository';
import type { SocialLinkRepository } from '../../domain/social-links/social-link-repository';

const SELECT_LINKS = 'SELECT id, profile_id AS profileId, platform, url FROM social_links';

export class D1SocialLinkRepository implements SocialLinkRepository {
  constructor(private readonly database: D1Database) {}

  async list(): Promise<SocialLink[]> {
    const result = await this.database.prepare(`${SELECT_LINKS} ORDER BY profile_id ASC, id ASC`).all<SocialLink>();
    return result.results;
  }

  findById(id: number): Promise<SocialLink | null> {
    return this.database.prepare(`${SELECT_LINKS} WHERE id = ? LIMIT 1`).bind(id).first<SocialLink>();
  }

  async create(input: CreateSocialLinkInput): Promise<SocialLink> {
    await this.assertProfileExists(input.profileId);
    const row = await this.database.prepare(
      'INSERT INTO social_links (profile_id, platform, url) VALUES (?, ?, ?) RETURNING id'
    ).bind(input.profileId, input.platform, input.url).first<{ id: number }>();
    if (!row) throw new Error('Social link insert did not return an ID.');
    const link = await this.findById(row.id);
    if (!link) throw new Error('Created social link could not be reloaded.');
    return link;
  }

  async update(id: number, input: UpdateSocialLinkInput): Promise<SocialLink | null> {
    if (input.profileId !== undefined) await this.assertProfileExists(input.profileId);
    const fields: Array<[keyof UpdateSocialLinkInput, string]> = [
      ['profileId', 'profile_id'], ['platform', 'platform'], ['url', 'url']
    ];
    const updates: string[] = [];
    const values: Array<string | number> = [];
    for (const [key, column] of fields) {
      if (!Object.hasOwn(input, key)) continue;
      updates.push(`${column} = ?`);
      values.push(input[key] as string | number);
    }
    if (updates.length) {
      await this.database.prepare(`UPDATE social_links SET ${updates.join(', ')} WHERE id = ?`).bind(...values, id).run();
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.database.prepare('DELETE FROM social_links WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  private async assertProfileExists(profileId: number): Promise<void> {
    const profile = await this.database.prepare('SELECT id FROM profiles WHERE id = ? LIMIT 1').bind(profileId).first<{ id: number }>();
    if (!profile) throw new SocialLinkProfileNotFoundError();
  }
}
