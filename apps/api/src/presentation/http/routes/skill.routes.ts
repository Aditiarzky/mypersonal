import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { SkillService } from '../../../application/skills/skill-service';
import type { CreateSkillInput, UpdateSkillInput } from '../../../domain/skills/skill';
import type { UserRepository } from '../../../domain/users/user-repository';
import { createRequireSession } from '../middleware/require-session';
import { errorResponse, successResponse } from '../api-response';

function parseSkillBody(value: unknown, partial: boolean): CreateSkillInput | UpdateSkillInput | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const allowed = new Set(['name', 'category', 'iconUrl']);
  const keys = Object.keys(input);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) return null;
  if (!partial && (!('name' in input) || !('category' in input))) return null;

  const result: UpdateSkillInput = {};
  for (const key of ['name', 'category'] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (typeof value !== 'string' || value.trim().length === 0 || value.length > 50) return null;
    result[key] = value.trim();
  }
  if ('iconUrl' in input) {
    const value = input.iconUrl;
    if (value === null) {
      result.iconUrl = null;
    } else {
      if (typeof value !== 'string' || value.trim().length === 0 || value.length > 2000) return null;
      try {
        if (!['http:', 'https:'].includes(new URL(value).protocol)) return null;
      } catch {
        return null;
      }
      result.iconUrl = value.trim();
    }
  } else if (!partial) {
    result.iconUrl = null;
  }
  return result;
}

export function createSkillRoutes(dependencies: {
  skillsFor: (context: Context<AppEnv>) => SkillService;
  usersFor: (context: Context<AppEnv>) => UserRepository;
}) {
  const routes = new Hono<AppEnv>();
  const requireSession = createRequireSession(dependencies.usersFor);

  routes.get('/', async (c) => successResponse(c, await dependencies.skillsFor(c).list()));

  routes.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const skill = await dependencies.skillsFor(c).findById(id);
    return skill ? successResponse(c, skill) : errorResponse(c, 'skill_not_found', 404);
  });

  routes.post('/', requireSession, async (c) => {
    const input = parseSkillBody(await c.req.json<unknown>().catch(() => null), false);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    return successResponse(c, await dependencies.skillsFor(c).create(input as CreateSkillInput), 201);
  });

  routes.patch('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const input = parseSkillBody(await c.req.json<unknown>().catch(() => null), true);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    const skill = await dependencies.skillsFor(c).update(id, input);
    return skill ? successResponse(c, skill) : errorResponse(c, 'skill_not_found', 404);
  });

  routes.delete('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const deleted = await dependencies.skillsFor(c).delete(id);
    return deleted ? c.body(null, 204) : errorResponse(c, 'skill_not_found', 404);
  });

  return routes;
}
