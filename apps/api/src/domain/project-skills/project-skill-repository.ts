import type { ProjectSkill } from '../projects/project';

export interface ProjectSkillRepository {
  listForProject(projectId: number): Promise<ProjectSkill[] | null>;
  add(projectId: number, skillId: number): Promise<ProjectSkill>;
  remove(projectId: number, skillId: number): Promise<boolean | null>;
}

export class ProjectNotFoundError extends Error {}
export class SkillNotFoundError extends Error {}
export class ProjectSkillConflictError extends Error {}
