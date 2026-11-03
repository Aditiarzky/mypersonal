import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { SocialLinkService } from '../../../application/social-links/social-link-service';
import type { CreateSocialLinkInput, UpdateSocialLinkInput } from '../../../domain/social-links/social-link';
import { SocialLinkProfileNotFoundError } from '../../../domain/social-links/social-link-repository';
import type { UserRepository } from '../../../domain/users/user-repository';
import { createRequireSession } from '../middleware/require-session';
import { errorResponse, successResponse } from '../api-response';

type SocialLinkInput = CreateSocialLinkInput | UpdateSocialLinkInput;

function parseSocialLinkBody(value: unknown, partial: boolean): SocialLinkInput | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const allowed = new Set(['profileId', 'platform', 'url']);
  const keys = Object.keys(input);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) return null;
  if (!partial && (!('profileId' in input) || !('platform' in input) || !('url' in input))) return null;

  const result: UpdateSocialLinkInput = {};
  if ('profileId' in input) {
    if (!Number.isSafeInteger(input.profileId) || Number(input.profileId) < 1) return null;
    result.profileId = input.profileId as number;
  }
  if ('platform' in input) {
    if (typeof input.platform !== 'string' || input.platform.trim().length === 0 || input.platform.length > 50) return null;
    result.platform = input.platform.trim();
  }
  if ('url' in input) {
    if (typeof input.url !== 'string' || input.url.trim().length === 0 || input.url.length > 2000) return null;
    try {
      if (!['http:', 'https:'].includes(new URL(input.url).protocol)) return null;
    } catch {
      return null;
    }
    result.url = input.url.trim();
  }
  return result;
}

export function createSocialLinkRoutes(dependencies: {
  linksFor: (context: Context<AppEnv>) => SocialLinkService;
  usersFor: (context: Context<AppEnv>) => UserRepository;
}) {
  const routes = new Hono<AppEnv>();
  const requireSession = createRequireSession(dependencies.usersFor);

  routes.get('/', async (c) => successResponse(c, await dependencies.linksFor(c).list()));

  routes.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const link = await dependencies.linksFor(c).findById(id);
    return link ? successResponse(c, link) : errorResponse(c, 'social_link_not_found', 404);
  });

  routes.post('/', requireSession, async (c) => {
    const input = parseSocialLinkBody(await c.req.json<unknown>().catch(() => null), false);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    try {
      return successResponse(c, await dependencies.linksFor(c).create(input as CreateSocialLinkInput), 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  routes.patch('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const input = parseSocialLinkBody(await c.req.json<unknown>().catch(() => null), true);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    try {
      const link = await dependencies.linksFor(c).update(id, input);
      return link ? successResponse(c, link) : errorResponse(c, 'social_link_not_found', 404);
    } catch (error) {
      return handleError(c, error);
    }
  });

  routes.delete('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const deleted = await dependencies.linksFor(c).delete(id);
    return deleted ? c.body(null, 204) : errorResponse(c, 'social_link_not_found', 404);
  });

  function handleError(c: Context<AppEnv>, error: unknown) {
    if (error instanceof SocialLinkProfileNotFoundError) return errorResponse(c, 'profile_not_found', 404);
    throw error;
  }

  return routes;
}
