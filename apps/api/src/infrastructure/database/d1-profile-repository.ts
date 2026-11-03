import type { CreateProfileInput, Profile, SocialLinkSummary, UpdateProfileInput } from '../../domain/profiles/profile';
import { ProfileUserNotFoundError } from '../../domain/profiles/profile-repository';
import type { ProfileRepository } from '../../domain/profiles/profile-repository';

interface ProfileRow {
  id: number; userId: number; title: string; bio: string;
  avatarUrl: string | null; cvUrl: string | null; location: string | null;
}
interface SocialLinkRow { id: number; platform: string; url: string }
const SELECT_PROFILES = `SELECT id, user_id AS userId, title, bio,
  avatar_url AS avatarUrl, cv_url AS cvUrl, location FROM profiles`;

export class D1ProfileRepository implements ProfileRepository {
  constructor(private readonly database: D1Database) {}

  async list(): Promise<Profile[]> {
    const result = await this.database.prepare(`${SELECT_PROFILES} ORDER BY id ASC`).all<ProfileRow>();
    return Promise.all(result.results.map((row) => this.withSocialLinks(row)));
  }

  async findById(id: number): Promise<Profile | null> {
    const row = await this.database.prepare(`${SELECT_PROFILES} WHERE id = ? LIMIT 1`).bind(id).first<ProfileRow>();
    return row ? this.withSocialLinks(row) : null;
  }

  async create(input: CreateProfileInput): Promise<Profile> {
    await this.assertUserExists(input.userId);
    const row = await this.database.prepare(
      `INSERT INTO profiles (user_id, title, bio, avatar_url, cv_url, location)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
    ).bind(input.userId, input.title, input.bio, input.avatarUrl, input.cvUrl, input.location).first<{ id: number }>();
    if (!row) throw new Error('Profile insert did not return an ID.');
    const profile = await this.findById(row.id);
    if (!profile) throw new Error('Created profile could not be reloaded.');
    return profile;
  }

  async update(id: number, input: UpdateProfileInput): Promise<Profile | null> {
    if (input.userId !== undefined) await this.assertUserExists(input.userId);
    const fields: Array<[keyof UpdateProfileInput, string]> = [
      ['userId', 'user_id'], ['title', 'title'], ['bio', 'bio'],
      ['avatarUrl', 'avatar_url'], ['cvUrl', 'cv_url'], ['location', 'location']
    ];
    const updates: string[] = [];
    const values: Array<string | number | null> = [];
    for (const [key, column] of fields) {
      if (!Object.hasOwn(input, key)) continue;
      updates.push(`${column} = ?`);
      values.push(input[key] as string | number | null);
    }
    if (updates.length) {
      await this.database.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`).bind(...values, id).run();
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const results = await this.database.batch([
      this.database.prepare('DELETE FROM social_links WHERE profile_id = ?').bind(id),
      this.database.prepare('DELETE FROM profiles WHERE id = ?').bind(id)
    ]);
    return (results[1]?.meta.changes ?? 0) > 0;
  }

  private async assertUserExists(userId: number): Promise<void> {
    const user = await this.database.prepare('SELECT id FROM users WHERE id = ? LIMIT 1').bind(userId).first<{ id: number }>();
    if (!user) throw new ProfileUserNotFoundError();
  }

  private async withSocialLinks(row: ProfileRow): Promise<Profile> {
    const links = await this.database.prepare(
      'SELECT id, platform, url FROM social_links WHERE profile_id = ? ORDER BY id ASC'
    ).bind(row.id).all<SocialLinkRow>();
    return { ...row, socialLinks: links.results };
  }
}
