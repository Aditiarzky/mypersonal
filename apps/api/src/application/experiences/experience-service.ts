import type { CreateExperienceInput, Experience, UpdateExperienceInput } from '../../domain/experiences/experience';
import type { ExperienceRepository } from '../../domain/experiences/experience-repository';

export class ExperienceService {
  constructor(private readonly experiences: ExperienceRepository) {}
  list(): Promise<Experience[]> { return this.experiences.list(); }
  findById(id: number): Promise<Experience | null> { return this.experiences.findById(id); }
  create(input: CreateExperienceInput): Promise<Experience> { return this.experiences.create(input); }
  update(id: number, input: UpdateExperienceInput): Promise<Experience | null> { return this.experiences.update(id, input); }
  delete(id: number): Promise<boolean> { return this.experiences.delete(id); }
}
