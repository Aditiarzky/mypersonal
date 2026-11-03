import type { CreateSkillInput, Skill, UpdateSkillInput } from '../../domain/skills/skill';
import type { SkillRepository } from '../../domain/skills/skill-repository';

interface SkillRow { id: number; name: string; category: string; iconUrl: string | null }
const SELECT_SKILLS = 'SELECT id, name, category, icon_url AS iconUrl FROM skills';

export class D1SkillRepository implements SkillRepository {
  constructor(private readonly database: D1Database) {}

  async list(): Promise<Skill[]> {
    const result = await this.database.prepare(`${SELECT_SKILLS} ORDER BY category ASC, name ASC, id ASC`).all<SkillRow>();
    return result.results;
  }

  findById(id: number): Promise<Skill | null> {
    return this.database.prepare(`${SELECT_SKILLS} WHERE id = ? LIMIT 1`).bind(id).first<SkillRow>();
  }

  async create(input: CreateSkillInput): Promise<Skill> {
    const row = await this.database.prepare(
      'INSERT INTO skills (name, category, icon_url) VALUES (?, ?, ?) RETURNING id'
    ).bind(input.name, input.category, input.iconUrl).first<{ id: number }>();
    if (!row) throw new Error('Skill insert did not return an ID.');
    const skill = await this.findById(row.id);
    if (!skill) throw new Error('Created skill could not be reloaded.');
    return skill;
  }

  async update(id: number, input: UpdateSkillInput): Promise<Skill | null> {
    const fields: Array<[keyof UpdateSkillInput, string]> = [
      ['name', 'name'],
      ['category', 'category'],
      ['iconUrl', 'icon_url']
    ];
    const updates: string[] = [];
    const values: Array<string | null> = [];
    for (const [key, column] of fields) {
      if (!Object.hasOwn(input, key)) continue;
      updates.push(`${column} = ?`);
      values.push(input[key] as string | null);
    }
    if (updates.length) {
      await this.database.prepare(`UPDATE skills SET ${updates.join(', ')} WHERE id = ?`).bind(...values, id).run();
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const results = await this.database.batch([
      this.database.prepare('DELETE FROM project_skills WHERE skill_id = ?').bind(id),
      this.database.prepare('DELETE FROM skills WHERE id = ?').bind(id)
    ]);
    return (results[1]?.meta.changes ?? 0) > 0;
  }
}
