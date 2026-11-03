import type { Skill } from '../skills/skill';

export interface Experience {
  id: number;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  skills: Skill[];
}

export interface CreateExperienceInput {
  companyName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  skillIds: number[];
}

export type UpdateExperienceInput = Partial<Omit<CreateExperienceInput, 'skillIds'>> & {
  skillIds?: number[];
};
