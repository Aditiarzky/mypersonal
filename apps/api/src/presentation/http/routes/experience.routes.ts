import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { ExperienceService } from '../../../application/experiences/experience-service';
import type { CreateExperienceInput, UpdateExperienceInput } from '../../../domain/experiences/experience';
import { ExperienceSkillsNotFoundError } from '../../../domain/experiences/experience-repository';
import type { UserRepository } from '../../../domain/users/user-repository';
import { createRequireSession } from '../middleware/require-session';
import { errorResponse, successResponse } from '../api-response';

type ExperienceInput = CreateExperienceInput | UpdateExperienceInput;
function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseExperienceBody(value: unknown, partial: boolean): ExperienceInput | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const allowed = new Set(['companyName', 'role', 'startDate', 'endDate', 'description', 'skillIds']);
  const keys = Object.keys(input);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) return null;
  if (!partial && (!('companyName' in input) || !('role' in input) || !('startDate' in input))) return null;

  const result: UpdateExperienceInput = {};
  for (const [key, maxLength] of [['companyName', 150], ['role', 100], ['description', 100_000]] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (key === 'description' && value === null) { result.description = null; continue; }
    if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) return null;
    result[key] = value.trim();
  }
  for (const key of ['startDate', 'endDate'] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (key === 'endDate' && value === null) { result.endDate = null; continue; }
    if (typeof value !== 'string' || !isDateOnly(value)) return null;
    result[key] = value;
  }
  if ('skillIds' in input) {
    const value = input.skillIds;
    if (
      !Array.isArray(value) ||
      value.some((id) => !Number.isSafeInteger(id) || id < 1)
    ) {
      return null;
    }
    result.skillIds = [...new Set(value as number[])];
  }
  if (!partial) {
    result.endDate ??= null;
    result.description ??= null;
    result.skillIds ??= [];
  }
  return result;
}

function experienceErrorResponse(c: Context<AppEnv>, error: unknown) {
  if (error instanceof ExperienceSkillsNotFoundError) {
    return errorResponse(c, 'unknown_skill_ids', 400, {
      details: { skillIds: error.skillIds },
    });
  }
  throw error;
}

export function createExperienceRoutes(dependencies: {
  experiencesFor: (context: Context<AppEnv>) => ExperienceService;
  usersFor: (context: Context<AppEnv>) => UserRepository;
}) {
  const routes = new Hono<AppEnv>();
  const requireSession = createRequireSession(dependencies.usersFor);

  routes.get('/', async (c) => successResponse(c, await dependencies.experiencesFor(c).list()));

  routes.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const experience = await dependencies.experiencesFor(c).findById(id);
    return experience ? successResponse(c, experience) : errorResponse(c, 'experience_not_found', 404);
  });

  routes.post('/', requireSession, async (c) => {
    const input = parseExperienceBody(await c.req.json<unknown>().catch(() => null), false);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    const createInput = input as CreateExperienceInput;
    if (createInput.endDate !== null && createInput.endDate < createInput.startDate) return errorResponse(c, 'invalid_request', 400);
    try {
      return successResponse(c, await dependencies.experiencesFor(c).create(createInput), 201);
    } catch (error) {
      return experienceErrorResponse(c, error);
    }
  });

  routes.patch('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const input = parseExperienceBody(await c.req.json<unknown>().catch(() => null), true);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    if ('startDate' in input || 'endDate' in input) {
      const current = await dependencies.experiencesFor(c).findById(id);
      if (!current) return errorResponse(c, 'experience_not_found', 404);
      const startDate = input.startDate ?? current.startDate;
      const endDate = input.endDate === undefined ? current.endDate : input.endDate;
      if (endDate !== null && endDate < startDate) return errorResponse(c, 'invalid_request', 400);
    }
    try {
      const experience = await dependencies.experiencesFor(c).update(id, input);
      return experience ? successResponse(c, experience) : errorResponse(c, 'experience_not_found', 404);
    } catch (error) {
      return experienceErrorResponse(c, error);
    }
  });

  routes.delete('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const deleted = await dependencies.experiencesFor(c).delete(id);
    return deleted ? c.body(null, 204) : errorResponse(c, 'experience_not_found', 404);
  });

  return routes;
}
