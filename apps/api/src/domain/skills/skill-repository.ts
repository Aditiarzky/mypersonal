import type { CreateSkillInput, Skill, UpdateSkillInput } from './skill';

export interface SkillRepository {
  list(): Promise<Skill[]>;
  findById(id: number): Promise<Skill | null>;
  create(input: CreateSkillInput): Promise<Skill>;
  update(id: number, input: UpdateSkillInput): Promise<Skill | null>;
  delete(id: number): Promise<boolean>;
}
