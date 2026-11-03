import type { CreateExperienceInput, Experience, UpdateExperienceInput } from '../../domain/experiences/experience';
import type { ExperienceRepository } from '../../domain/experiences/experience-repository';

interface ExperienceRow {
  id: number;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}
const SELECT_EXPERIENCES = `SELECT id, company_name AS companyName, role,
  start_date AS startDate, end_date AS endDate, description FROM experiences`;

export class D1ExperienceRepository implements ExperienceRepository {
  constructor(private readonly database: D1Database) {}

  async list(): Promise<Experience[]> {
    const result = await this.database.prepare(`${SELECT_EXPERIENCES} ORDER BY start_date DESC, id DESC`).all<ExperienceRow>();
    return result.results;
  }

  findById(id: number): Promise<Experience | null> {
    return this.database.prepare(`${SELECT_EXPERIENCES} WHERE id = ? LIMIT 1`).bind(id).first<ExperienceRow>();
  }

  async create(input: CreateExperienceInput): Promise<Experience> {
    const row = await this.database.prepare(
      `INSERT INTO experiences (company_name, role, start_date, end_date, description)
       VALUES (?, ?, ?, ?, ?) RETURNING id`
    ).bind(input.companyName, input.role, input.startDate, input.endDate, input.description).first<{ id: number }>();
    if (!row) throw new Error('Experience insert did not return an ID.');
    const experience = await this.findById(row.id);
    if (!experience) throw new Error('Created experience could not be reloaded.');
    return experience;
  }

  async update(id: number, input: UpdateExperienceInput): Promise<Experience | null> {
    const fields: Array<[keyof UpdateExperienceInput, string]> = [
      ['companyName', 'company_name'], ['role', 'role'], ['startDate', 'start_date'],
      ['endDate', 'end_date'], ['description', 'description']
    ];
    const updates: string[] = [];
    const values: Array<string | null> = [];
    for (const [key, column] of fields) {
      if (!Object.hasOwn(input, key)) continue;
      updates.push(`${column} = ?`);
      values.push(input[key] as string | null);
    }
    if (updates.length) {
      await this.database.prepare(`UPDATE experiences SET ${updates.join(', ')} WHERE id = ?`).bind(...values, id).run();
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.database.prepare('DELETE FROM experiences WHERE id = ?').bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
