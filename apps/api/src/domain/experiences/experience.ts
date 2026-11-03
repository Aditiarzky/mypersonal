export interface Experience {
  id: number;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export interface CreateExperienceInput {
  companyName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export type UpdateExperienceInput = Partial<CreateExperienceInput>;
