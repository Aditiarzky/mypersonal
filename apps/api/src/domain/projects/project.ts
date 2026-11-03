export interface ProjectSkill {
  id: number;
  name: string;
  category: string;
  iconUrl: string | null;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  demoUrl: string | null;
  sourceCodeUrl: string | null;
  orderPosition: number;
  createdAt: string;
  skills: ProjectSkill[];
}

export interface CreateProjectInput {
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  demoUrl: string | null;
  sourceCodeUrl: string | null;
  orderPosition: number;
  skillIds: number[];
}

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, 'skillIds'>> & {
  skillIds?: number[];
};