import type { CreateProjectInput, Project, UpdateProjectInput } from './project';

export interface ProjectRepository {
  list(): Promise<Project[]>;
  findBySlug(slug: string): Promise<Project | null>;
  create(input: CreateProjectInput): Promise<Project>;
  update(id: number, input: UpdateProjectInput): Promise<Project | null>;
  delete(id: number): Promise<boolean>;
  hasSlug(slug: string): Promise<boolean>;
}

export class ProjectSkillsNotFoundError extends Error {
  constructor(readonly skillIds: number[]) {
    super(`Unknown skill IDs: ${skillIds.join(', ')}`);
    this.name = 'ProjectSkillsNotFoundError';
  }
}