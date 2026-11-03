import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { ProfileService } from '../../../application/profiles/profile-service';
import type { CreateProfileInput, UpdateProfileInput } from '../../../domain/profiles/profile';
import { ProfileUserNotFoundError } from '../../../domain/profiles/profile-repository';
import type { UserRepository } from '../../../domain/users/user-repository';
import { createRequireSession } from '../middleware/require-session';
import { errorResponse, successResponse } from '../api-response';

type ProfileInput = CreateProfileInput | UpdateProfileInput;

function parseProfileBody(value: unknown, partial: boolean): ProfileInput | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const allowed = new Set(['userId', 'name', 'title', 'bio', 'avatarUrl', 'cvUrl', 'location']);
  const keys = Object.keys(input);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) return null;
  if (!partial && (!('userId' in input) || !('name' in input) || !('title' in input) || !('bio' in input))) return null;

  const result: UpdateProfileInput = {};
  if ('userId' in input) {
    if (!Number.isSafeInteger(input.userId) || Number(input.userId) < 1) return null;
    result.userId = input.userId as number;
  }
  for (const [key, maxLength] of [['name', 100], ['title', 100], ['bio', 100_000], ['location', 100]] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (value === null && key === 'location') { result.location = null; continue; }
    if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) return null;
    result[key] = value.trim();
  }
  for (const key of ['avatarUrl', 'cvUrl'] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (value === null) { result[key] = null; continue; }
    if (typeof value !== 'string' || value.trim().length === 0 || value.length > 2000) return null;
    try {
      if (!['http:', 'https:'].includes(new URL(value).protocol)) return null;
    } catch {
      return null;
    }
    result[key] = value.trim();
  }
  if (!partial) {
    result.avatarUrl ??= null;
    result.cvUrl ??= null;
    result.location ??= null;
  }
  return result;
}

export function createProfileRoutes(dependencies: {
  profilesFor: (context: Context<AppEnv>) => ProfileService;
  usersFor: (context: Context<AppEnv>) => UserRepository;
}) {
  const routes = new Hono<AppEnv>();
  const requireSession = createRequireSession(dependencies.usersFor);

  routes.get('/', async (c) => successResponse(c, await dependencies.profilesFor(c).list()));

  routes.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const profile = await dependencies.profilesFor(c).findById(id);
    return profile ? successResponse(c, profile) : errorResponse(c, 'profile_not_found', 404);
  });

  routes.post('/', requireSession, async (c) => {
    const input = parseProfileBody(await c.req.json<unknown>().catch(() => null), false);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    try {
      return successResponse(c, await dependencies.profilesFor(c).create(input as CreateProfileInput), 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  routes.patch('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const input = parseProfileBody(await c.req.json<unknown>().catch(() => null), true);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    try {
      const profile = await dependencies.profilesFor(c).update(id, input);
      return profile ? successResponse(c, profile) : errorResponse(c, 'profile_not_found', 404);
    } catch (error) {
      return handleError(c, error);
    }
  });

  routes.delete('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const deleted = await dependencies.profilesFor(c).delete(id);
    return deleted ? c.body(null, 204) : errorResponse(c, 'profile_not_found', 404);
  });

  function handleError(c: Context<AppEnv>, error: unknown) {
    if (error instanceof ProfileUserNotFoundError) return errorResponse(c, 'user_not_found', 404);
    if (error instanceof Error && /unique constraint failed/iu.test(error.message)) {
      return errorResponse(c, 'profile_user_conflict', 409);
    }
    throw error;
  }

  return routes;
}
