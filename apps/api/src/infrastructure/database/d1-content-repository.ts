import type { ContentEntity, ContentRecord, ContentRepository } from '../../domain/content/content-repository';

const CONFIG = {
  profiles: { table: 'profiles', fields: { userId: 'user_id', title: 'title', bio: 'bio', avatarUrl: 'avatar_url', cvUrl: 'cv_url', location: 'location' }, order: 'id ASC' },
  social_links: { table: 'social_links', fields: { profileId: 'profile_id', platform: 'platform', url: 'url' }, order: 'id ASC' },
  skills: { table: 'skills', fields: { name: 'name', category: 'category', iconUrl: 'icon_url' }, order: 'category ASC, name ASC, id ASC' },
  experiences: { table: 'experiences', fields: { companyName: 'company_name', role: 'role', startDate: 'start_date', endDate: 'end_date', description: 'description' }, order: 'start_date DESC, id DESC' },
  blogs: { table: 'blogs', fields: { title: 'title', slug: 'slug', content: 'content', coverImageUrl: 'cover_image_url', status: 'status' }, order: 'created_at DESC, id DESC' },
  inbox_messages: { table: 'inbox_messages', fields: { senderName: 'sender_name', senderEmail: 'sender_email', subject: 'subject', message: 'message' }, order: 'created_at DESC, id DESC' }
} as const;

function toCamel(key: string): string {
  return key.replace(/_([a-z])/gu, (_match, letter: string) => letter.toUpperCase());
}
function mapRow(row: Record<string, unknown>): ContentRecord {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamel(key), value]));
}

export class D1ContentRepository implements ContentRepository {
  constructor(private readonly database: D1Database) {}

  async list(entity: ContentEntity, options: { publishedOnly?: boolean } = {}): Promise<ContentRecord[]> {
    const config = CONFIG[entity];
    const where = entity === 'blogs' && options.publishedOnly ? " WHERE status = 'published'" : '';
    const result = await this.database.prepare(`SELECT * FROM ${config.table}${where} ORDER BY ${config.order}`).all<Record<string, unknown>>();
    const rows = result.results.map(mapRow);
    if (entity === 'profiles') {
      for (const profile of rows) profile.socialLinks = await this.socialLinks(Number(profile.id));
    }
    return rows;
  }

  async find(entity: ContentEntity, id: number, options: { publishedOnly?: boolean } = {}): Promise<ContentRecord | null> {
    const config = CONFIG[entity];
    const visibility = entity === 'blogs' && options.publishedOnly ? " AND status = 'published'" : '';
    const row = await this.database.prepare(`SELECT * FROM ${config.table} WHERE id = ?${visibility} LIMIT 1`).bind(id).first<Record<string, unknown>>();
    if (!row) return null;
    const result = mapRow(row);
    if (entity === 'profiles') result.socialLinks = await this.socialLinks(id);
    return result;
  }

  async create(entity: ContentEntity, input: ContentRecord): Promise<ContentRecord> {
    const config = CONFIG[entity];
    await this.assertRelation(entity, input);
    const entries = Object.entries(config.fields).filter(([field]) => Object.hasOwn(input, field));
    const columns = entries.map(([, column]) => column);
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map(([field]) => input[field]);
    const row = await this.database.prepare(
      `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`
    ).bind(...values).first<{ id: number }>();
    if (!row) throw new Error('Insert did not return an ID.');
    const created = await this.find(entity, row.id);
    if (!created) throw new Error('Created record could not be reloaded.');
    return created;
  }

  async update(entity: ContentEntity, id: number, input: ContentRecord): Promise<ContentRecord | null> {
    const config = CONFIG[entity];
    await this.assertRelation(entity, input);
    const entries = Object.entries(config.fields).filter(([field]) => Object.hasOwn(input, field));
    if (entries.length) {
      const assignments = entries.map(([, column]) => `${column} = ?`).join(', ');
      const values = entries.map(([field]) => input[field]);
      await this.database.prepare(`UPDATE ${config.table} SET ${assignments} WHERE id = ?`).bind(...values, id).run();
    }
    return this.find(entity, id);
  }

  async delete(entity: ContentEntity, id: number): Promise<boolean> {
    const config = CONFIG[entity];
    if (entity === 'profiles') {
      await this.database.prepare('DELETE FROM social_links WHERE profile_id = ?').bind(id).run();
    }
    if (entity === 'skills') {
      await this.database.prepare('DELETE FROM project_skills WHERE skill_id = ?').bind(id).run();
    }
    const result = await this.database.prepare(`DELETE FROM ${config.table} WHERE id = ?`).bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  private async assertRelation(entity: ContentEntity, input: ContentRecord): Promise<void> {
    if (entity === 'profiles' && typeof input.userId === 'number') {
      const row = await this.database.prepare('SELECT id FROM users WHERE id = ?').bind(input.userId).first('id');
      if (!row) throw new ContentRelationNotFoundError('user_not_found');
    }
    if (entity === 'social_links' && typeof input.profileId === 'number') {
      const row = await this.database.prepare('SELECT id FROM profiles WHERE id = ?').bind(input.profileId).first('id');
      if (!row) throw new ContentRelationNotFoundError('profile_not_found');
    }
  }

  private async socialLinks(profileId: number): Promise<ContentRecord[]> {
    const result = await this.database.prepare('SELECT * FROM social_links WHERE profile_id = ? ORDER BY id ASC').bind(profileId).all<Record<string, unknown>>();
    return result.results.map(mapRow);
  }
}

export class ContentRelationNotFoundError extends Error {
  constructor(readonly code: 'user_not_found' | 'profile_not_found') { super(code); }
}
