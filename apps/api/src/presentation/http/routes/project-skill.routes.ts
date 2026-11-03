import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { ProjectSkillService } from '../../../application/project-skills/project-skill-service';
import {
  ProjectNotFoundError,
  ProjectSkillConflictError,
  SkillNotFoundError
} from '../../../domain/project-skills/project-skill-repository';
import type { UserRepository } from '../../../domain/users/user-repository';
import { createRequireSession } from '../middleware/require-session';
import { errorResponse, successResponse } from '../api-response';

export function createProjectSkillRoutes(dependencies: {
  projectSkillsFor: (context: Context<AppEnv>) => ProjectSkillService;
  usersFor: (context: Context<AppEnv>) => UserRepository;
}) {
  const routes = new Hono<AppEnv>();
  const requireSession = createRequireSession(dependencies.usersFor);

  routes.get('/:projectId/skills', async (c) => {
    const projectId = Number(c.req.param('projectId'));
    if (!Number.isSafeInteger(projectId) || projectId < 1) return errorResponse(c, 'invalid_project_id', 400);
    const skills = await dependencies.projectSkillsFor(c).listForProject(projectId);
    return skills ? successResponse(c, skills) : errorResponse(c, 'project_not_found', 404);
  });

  routes.post('/:projectId/skills', requireSession, async (c) => {
    const projectId = Number(c.req.param('projectId'));
    if (!Number.isSafeInteger(projectId) || projectId < 1) return errorResponse(c, 'invalid_project_id', 400);
    const body = await c.req.json<unknown>().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body) || !('skillId' in body)) {
      return errorResponse(c, 'invalid_request', 400);
    }
    const skillId = body.skillId;
    if (!Number.isSafeInteger(skillId) || Number(skillId) < 1) return errorResponse(c, 'invalid_request', 400);
    try {
      return successResponse(c, await dependencies.projectSkillsFor(c).add(projectId, Number(skillId)), 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  routes.delete('/:projectId/skills/:skillId', requireSession, async (c) => {
    const projectId = Number(c.req.param('projectId'));
    const skillId = Number(c.req.param('skillId'));
    if (!Number.isSafeInteger(projectId) || projectId < 1) return errorResponse(c, 'invalid_project_id', 400);
    if (!Number.isSafeInteger(skillId) || skillId < 1) return errorResponse(c, 'invalid_skill_id', 400);
    const deleted = await dependencies.projectSkillsFor(c).remove(projectId, skillId);
    if (deleted === null) return errorResponse(c, 'project_not_found', 404);
    return deleted ? c.body(null, 204) : errorResponse(c, 'project_skill_not_found', 404);
  });

  function handleError(c: Context<AppEnv>, error: unknown) {
    if (error instanceof ProjectNotFoundError) return errorResponse(c, 'project_not_found', 404);
    if (error instanceof SkillNotFoundError) return errorResponse(c, 'skill_not_found', 404);
    if (error instanceof ProjectSkillConflictError || (error instanceof Error && /unique constraint failed/iu.test(error.message))) {
      return errorResponse(c, 'project_skill_conflict', 409);
    }
    throw error;
  }

  return routes;
}
