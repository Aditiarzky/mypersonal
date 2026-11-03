export interface Skill {
  id: number;
  name: string;
  category: string;
  iconUrl: string | null;
}

export interface CreateSkillInput {
  name: string;
  category: string;
  iconUrl: string | null;
}

export type UpdateSkillInput = Partial<CreateSkillInput>;
