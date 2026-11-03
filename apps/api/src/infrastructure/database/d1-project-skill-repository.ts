import type { ProjectSkill } from '../../domain/projects/project';
import {
  ProjectNotFoundError,
  ProjectSkillConflictError,
  SkillNotFoundError
} from '../../domain/project-skills/project-skill-repository';
import type { ProjectSkillRepository } from '../../domain/project-skills/project-skill-repository';

export class D1ProjectSkillRepository implements ProjectSkillRepository {
  constructor(private readonly database: D1Database) {}

  async listForProject(projectId: number): Promise<ProjectSkill[] | null> {
    const project = await this.database.prepare('SELECT id FROM projects WHERE id = ? LIMIT 1').bind(projectId).first<{ id: number }>();
    if (!project) return null;
    const result = await this.database.prepare(
      `SELECT s.id, s.name, s.category, s.icon_url AS iconUrl
       FROM project_skills ps JOIN skills s ON s.id = ps.skill_id
       WHERE ps.project_id = ? ORDER BY s.name ASC, s.id ASC`
    ).bind(projectId).all<ProjectSkill>();
    return result.results;
  }

  async add(projectId: number, skillId: number): Promise<ProjectSkill> {
    const project = await this.database.prepare('SELECT id FROM projects WHERE id = ? LIMIT 1').bind(projectId).first<{ id: number }>();
    if (!project) throw new ProjectNotFoundError();
    const skill = await this.database.prepare(
      'SELECT id, name, category, icon_url AS iconUrl FROM skills WHERE id = ? LIMIT 1'
    ).bind(skillId).first<ProjectSkill>();
    if (!skill) throw new SkillNotFoundError();
    const existing = await this.database.prepare(
      'SELECT 1 AS found FROM project_skills WHERE project_id = ? AND skill_id = ? LIMIT 1'
    ).bind(projectId, skillId).first<{ found: number }>();
    if (existing) throw new ProjectSkillConflictError();
    await this.database.prepare('INSERT INTO project_skills (project_id, skill_id) VALUES (?, ?)').bind(projectId, skillId).run();
    return skill;
  }

  async remove(projectId: number, skillId: number): Promise<boolean | null> {
    const project = await this.database.prepare('SELECT id FROM projects WHERE id = ? LIMIT 1').bind(projectId).first<{ id: number }>();
    if (!project) return null;
    const result = await this.database.prepare(
      'DELETE FROM project_skills WHERE project_id = ? AND skill_id = ?'
    ).bind(projectId, skillId).run();
    return (result.meta.changes ?? 0) > 0;
  }
}
