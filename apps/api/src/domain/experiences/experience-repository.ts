import type { CreateExperienceInput, Experience, UpdateExperienceInput } from './experience';

export interface ExperienceRepository {
  list(): Promise<Experience[]>;
  findById(id: number): Promise<Experience | null>;
  create(input: CreateExperienceInput): Promise<Experience>;
  update(id: number, input: UpdateExperienceInput): Promise<Experience | null>;
  delete(id: number): Promise<boolean>;
}

export class ExperienceSkillsNotFoundError extends Error {
  constructor(readonly skillIds: number[]) {
    super(`Unknown skill IDs: ${skillIds.join(', ')}`);
    this.name = 'ExperienceSkillsNotFoundError';
  }
}
