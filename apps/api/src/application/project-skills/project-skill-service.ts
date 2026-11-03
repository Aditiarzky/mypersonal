import type { ProjectSkill } from '../../domain/projects/project';
import type { ProjectSkillRepository } from '../../domain/project-skills/project-skill-repository';

export class ProjectSkillService {
  constructor(private readonly assignments: ProjectSkillRepository) {}
  listForProject(projectId: number): Promise<ProjectSkill[] | null> { return this.assignments.listForProject(projectId); }
  add(projectId: number, skillId: number): Promise<ProjectSkill> { return this.assignments.add(projectId, skillId); }
  remove(projectId: number, skillId: number): Promise<boolean | null> { return this.assignments.remove(projectId, skillId); }
}
