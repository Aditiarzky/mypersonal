import type { CreateProjectInput, UpdateProjectInput } from '../../domain/projects/project';
import type { ProjectRepository } from '../../domain/projects/project-repository';

export class ProjectSlugConflictError extends Error {
  constructor() {
    super('A project with this slug already exists.');
    this.name = 'ProjectSlugConflictError';
  }
}

export class ProjectService {
  constructor(private readonly projects: ProjectRepository) {}

  list() {
    return this.projects.list();
  }

  getBySlug(slug: string) {
    return this.projects.findBySlug(slug);
  }

  async create(input: CreateProjectInput) {
    if (await this.projects.hasSlug(input.slug)) {
      throw new ProjectSlugConflictError();
    }
    return this.projects.create(input);
  }

  async update(id: number, input: UpdateProjectInput) {
    if (input.slug && await this.projects.hasSlug(input.slug)) {
      const existing = await this.projects.findBySlug(input.slug);
      if (existing && existing.id !== id) throw new ProjectSlugConflictError();
    }
    return this.projects.update(id, input);
  }

  delete(id: number) {
    return this.projects.delete(id);
  }
}