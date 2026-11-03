export const SKILL_CATEGORIES = [
  'Frameworks & Libraries',
  'Programming Languages',
  'Soft Skills',
  'Development Tools',
  'Database',
  'Cloud & DevOps',
  'Design',
  'Other'
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export function getSkillCategories(): SkillCategory[] {
  return [...SKILL_CATEGORIES];
}
