import type { CreateProjectInput, Project, ProjectSkill, UpdateProjectInput } from '../../domain/projects/project';
import { ProjectSkillsNotFoundError } from '../../domain/projects/project-repository';
import type { ProjectRepository } from '../../domain/projects/project-repository';

type ProjectJoinRow = {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  images: string | null;
  demoUrl: string | null;
  sourceCodeUrl: string | null;
  orderPosition: number | null;
  createdAt: string;
  skillId: number | null;
  skillName: string | null;
  skillCategory: string | null;
  skillIconUrl: string | null;
};

function mapProjects(rows: ProjectJoinRow[]): Project[] {
  const projects = new Map<number, Project>();
  for (const row of rows) {
    let project = projects.get(row.id);
    if (!project) {
      project = {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        thumbnailUrl: row.thumbnailUrl,
        images: row.images === null ? null : JSON.parse(row.images) as string[],
        demoUrl: row.demoUrl,
        sourceCodeUrl: row.sourceCodeUrl,
        orderPosition: row.orderPosition ?? 0,
        createdAt: row.createdAt,
        skills: []
      };
      projects.set(row.id, project);
    }
    if (row.skillId !== null && row.skillName !== null && row.skillCategory !== null) {
      project.skills.push({
        id: row.skillId,
        name: row.skillName,
        category: row.skillCategory,
        iconUrl: row.skillIconUrl
      });
    }
  }
  return [...projects.values()];
}

const PROJECT_SELECT = `
  SELECT p.id, p.title, p.slug, p.description,
         p.thumbnail_url AS thumbnailUrl,
         p.images AS images,
         p.demo_url AS demoUrl,
         p.source_code_url AS sourceCodeUrl,
         p.order_position AS orderPosition,
         p.created_at AS createdAt,
         s.id AS skillId, s.name AS skillName,
         s.category AS skillCategory, s.icon_url AS skillIconUrl
  FROM projects p
  LEFT JOIN project_skills ps ON ps.project_id = p.id
  LEFT JOIN skills s ON s.id = ps.skill_id
`;

export class D1ProjectRepository implements ProjectRepository {
  constructor(private readonly database: D1Database) {}

  async list(): Promise<Project[]> {
    const result = await this.database
      .prepare(`${PROJECT_SELECT} ORDER BY p.order_position ASC, p.created_at DESC, p.id DESC`)
      .all<ProjectJoinRow>();
    return mapProjects(result.results);
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const result = await this.database
      .prepare(`${PROJECT_SELECT} WHERE p.slug = ? ORDER BY s.id`)
      .bind(slug)
      .all<ProjectJoinRow>();
    return mapProjects(result.results)[0] ?? null;
  }

  async hasSlug(slug: string): Promise<boolean> {
    const row = await this.database
      .prepare('SELECT 1 AS found FROM projects WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first<{ found: number }>();
    return row !== null;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    await this.assertSkillsExist(input.skillIds);
    const inserted = await this.database
      .prepare(
        `INSERT INTO projects
          (title, slug, description, thumbnail_url, images, demo_url, source_code_url, order_position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`
      )
      .bind(
        input.title,
        input.slug,
        input.description,
        input.thumbnailUrl,
        input.images === null ? null : JSON.stringify(input.images),
        input.demoUrl,
        input.sourceCodeUrl,
        input.orderPosition
      )
      .first<{ id: number }>();

    if (!inserted) throw new Error('Project insert did not return an ID.');
    try {
      await this.replaceSkills(inserted.id, input.skillIds);
      const project = await this.findBySlug(input.slug);
      if (!project) throw new Error('Created project could not be reloaded.');
      return project;
    } catch (error) {
      await this.database.prepare('DELETE FROM projects WHERE id = ?').bind(inserted.id).run();
      throw error;
    }
  }

  async update(id: number, input: UpdateProjectInput): Promise<Project | null> {
    const exists = await this.database
      .prepare('SELECT 1 AS found FROM projects WHERE id = ? LIMIT 1')
      .bind(id)
      .first<{ found: number }>();
    if (!exists) return null;
    if (input.skillIds !== undefined) await this.assertSkillsExist(input.skillIds);

    const updates: string[] = [];
    const values: Array<string | number | null> = [];
    const fields: Array<[keyof UpdateProjectInput, string]> = [
      ['title', 'title'],
      ['slug', 'slug'],
      ['description', 'description'],
      ['thumbnailUrl', 'thumbnail_url'],
      ['images', 'images'],
      ['demoUrl', 'demo_url'],
      ['sourceCodeUrl', 'source_code_url'],
      ['orderPosition', 'order_position']
    ];
    for (const [key, column] of fields) {
      if (Object.hasOwn(input, key)) {
        updates.push(`${column} = ?`);
        values.push(key === 'images' ? (input.images === null || input.images === undefined ? null : JSON.stringify(input.images)) : input[key] as string | number | null);
      }
    }

    const statements: D1PreparedStatement[] = [];
    if (updates.length) {
      statements.push(
        this.database
          .prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`)
          .bind(...values, id)
      );
    }
    if (input.skillIds !== undefined) {
      statements.push(this.database.prepare('DELETE FROM project_skills WHERE project_id = ?').bind(id));
      for (const skillId of input.skillIds) {
        statements.push(
          this.database
            .prepare('INSERT INTO project_skills (project_id, skill_id) VALUES (?, ?)')
            .bind(id, skillId)
        );
      }
    }
    if (statements.length) await this.database.batch(statements);

    const current = await this.database
      .prepare('SELECT slug FROM projects WHERE id = ? LIMIT 1')
      .bind(id)
      .first<{ slug: string }>();
    return current ? this.findBySlug(current.slug) : null;
  }

  async delete(id: number): Promise<boolean> {
    const results = await this.database.batch([
      this.database.prepare('DELETE FROM project_skills WHERE project_id = ?').bind(id),
      this.database.prepare('DELETE FROM projects WHERE id = ?').bind(id)
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
    const missing = uniqueIds.filter((id) => !found.has(id));
    if (missing.length) throw new ProjectSkillsNotFoundError(missing);
  }

  private async replaceSkills(projectId: number, skillIds: number[]): Promise<void> {
    if (!skillIds.length) return;
    const statements = skillIds.map((skillId) =>
      this.database
        .prepare('INSERT INTO project_skills (project_id, skill_id) VALUES (?, ?)')
        .bind(projectId, skillId)
    );
    await this.database.batch(statements);
  }
}



