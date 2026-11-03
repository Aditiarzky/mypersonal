import type {
  CreateExperienceInput,
  Experience,
  UpdateExperienceInput,
} from '../../domain/experiences/experience';
import type { ExperienceRepository } from '../../domain/experiences/experience-repository';
import { ExperienceSkillsNotFoundError } from '../../domain/experiences/experience-repository';
import type { Skill } from '../../domain/skills/skill';

interface ExperienceJoinRow {
  id: number;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  skillId: number | null;
  skillName: string | null;
  skillCategory: string | null;
  skillIconUrl: string | null;
}

const SELECT_EXPERIENCES = `SELECT e.id, e.company_name AS companyName, e.role,
  e.start_date AS startDate, e.end_date AS endDate, e.description,
  s.id AS skillId, s.name AS skillName, s.category AS skillCategory,
  s.icon_url AS skillIconUrl
  FROM experiences e
  LEFT JOIN experience_skills es ON es.experience_id = e.id
  LEFT JOIN skills s ON s.id = es.skill_id`;

function mapExperiences(rows: ExperienceJoinRow[]): Experience[] {
  const experiences = new Map<number, Experience>();
  for (const row of rows) {
    let experience = experiences.get(row.id);
    if (!experience) {
      experience = {
        id: row.id,
        companyName: row.companyName,
        role: row.role,
        startDate: row.startDate,
        endDate: row.endDate,
        description: row.description,
        skills: [],
      };
      experiences.set(row.id, experience);
    }

    if (
      row.skillId !== null &&
      row.skillName !== null &&
      row.skillCategory !== null
    ) {
      const skill: Skill = {
        id: row.skillId,
        name: row.skillName,
        category: row.skillCategory,
        iconUrl: row.skillIconUrl,
      };
      experience.skills.push(skill);
    }
  }
  return [...experiences.values()];
}

export class D1ExperienceRepository implements ExperienceRepository {
  constructor(private readonly database: D1Database) {}

  async list(): Promise<Experience[]> {
    const result = await this.database
      .prepare(
        `${SELECT_EXPERIENCES} ORDER BY e.start_date DESC, e.id DESC, s.name ASC`,
      )
      .all<ExperienceJoinRow>();
    return mapExperiences(result.results);
  }

  async findById(id: number): Promise<Experience | null> {
    const result = await this.database
      .prepare(`${SELECT_EXPERIENCES} WHERE e.id = ? ORDER BY s.name ASC`)
      .bind(id)
      .all<ExperienceJoinRow>();
    return mapExperiences(result.results)[0] ?? null;
  }

  async create(input: CreateExperienceInput): Promise<Experience> {
    await this.assertSkillsExist(input.skillIds);
    const row = await this.database
      .prepare(
        `INSERT INTO experiences (company_name, role, start_date, end_date, description)
         VALUES (?, ?, ?, ?, ?) RETURNING id`,
      )
      .bind(
        input.companyName,
        input.role,
        input.startDate,
        input.endDate,
        input.description,
      )
      .first<{ id: number }>();
    if (!row) throw new Error('Experience insert did not return an ID.');

    try {
      await this.replaceSkills(row.id, input.skillIds);
      const experience = await this.findById(row.id);
      if (!experience) throw new Error('Created experience could not be reloaded.');
      return experience;
    } catch (error) {
      await this.database
        .prepare('DELETE FROM experiences WHERE id = ?')
        .bind(row.id)
        .run();
      throw error;
    }
  }

  async update(
    id: number,
    input: UpdateExperienceInput,
  ): Promise<Experience | null> {
    const exists = await this.database
      .prepare('SELECT 1 AS found FROM experiences WHERE id = ? LIMIT 1')
      .bind(id)
      .first<{ found: number }>();
    if (!exists) return null;
    if (input.skillIds !== undefined) await this.assertSkillsExist(input.skillIds);

    const updates: string[] = [];
    const values: Array<string | null> = [];
    const fields: Array<[keyof UpdateExperienceInput, string]> = [
      ['companyName', 'company_name'],
      ['role', 'role'],
      ['startDate', 'start_date'],
      ['endDate', 'end_date'],
      ['description', 'description'],
    ];
    for (const [key, column] of fields) {
      if (!Object.hasOwn(input, key)) continue;
      updates.push(`${column} = ?`);
      values.push(input[key] as string | null);
    }

    const statements: D1PreparedStatement[] = [];
    if (updates.length) {
      statements.push(
        this.database
          .prepare(`UPDATE experiences SET ${updates.join(', ')} WHERE id = ?`)
          .bind(...values, id),
      );
    }
    if (input.skillIds !== undefined) {
      statements.push(
        this.database
          .prepare('DELETE FROM experience_skills WHERE experience_id = ?')
          .bind(id),
      );
      for (const skillId of [...new Set(input.skillIds)]) {
        statements.push(
          this.database
            .prepare(
              'INSERT INTO experience_skills (experience_id, skill_id) VALUES (?, ?)',
            )
            .bind(id, skillId),
        );
      }
    }
    if (statements.length) await this.database.batch(statements);

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const results = await this.database.batch([
      this.database
        .prepare('DELETE FROM experience_skills WHERE experience_id = ?')
        .bind(id),
      this.database.prepare('DELETE FROM experiences WHERE id = ?').bind(id),
    ]);
    return (results[1]?.meta.changes ?? 0) > 0;
  }

  private async assertSkillsExist(skillIds: number[]): Promise<void> {
    const uniqueIds = [...new Set(skillIds)];
    if (uniqueIds.length === 0) return;
    const placeholders = uniqueIds.map(() => '?').join(', ');
    const result = await this.database
      .prepare(`SELECT id FROM skills WHERE id IN (${placeholders})`)
      .bind(...uniqueIds)
      .all<{ id: number }>();
    const found = new Set(result.results.map((row) => row.id));
    const missing = uniqueIds.filter((skillId) => !found.has(skillId));
    if (missing.length) throw new ExperienceSkillsNotFoundError(missing);
  }

  private async replaceSkills(
    experienceId: number,
    skillIds: number[],
  ): Promise<void> {
    if (!skillIds.length) return;
    const statements = [...new Set(skillIds)].map((skillId) =>
      this.database
        .prepare(
          'INSERT INTO experience_skills (experience_id, skill_id) VALUES (?, ?)',
        )
        .bind(experienceId, skillId),
    );
    await this.database.batch(statements);
  }
}
