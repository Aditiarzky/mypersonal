import type { CreateSkillInput, Skill, UpdateSkillInput } from '../../domain/skills/skill';
import type { SkillRepository } from '../../domain/skills/skill-repository';

export class SkillService {
  constructor(private readonly skills: SkillRepository) {}
  list(): Promise<Skill[]> { return this.skills.list(); }
  findById(id: number): Promise<Skill | null> { return this.skills.findById(id); }
  create(input: CreateSkillInput): Promise<Skill> { return this.skills.create(input); }
  update(id: number, input: UpdateSkillInput): Promise<Skill | null> { return this.skills.update(id, input); }
  delete(id: number): Promise<boolean> { return this.skills.delete(id); }
}
