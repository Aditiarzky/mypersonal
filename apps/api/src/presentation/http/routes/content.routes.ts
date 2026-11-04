import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { ContentEntity, ContentRecord } from '../../../domain/content/content-repository';
import { ContentService } from '../../../application/content/content-service';
import { ContentRelationNotFoundError } from '../../../infrastructure/database/d1-content-repository';
import type { UserRepository } from '../../../domain/users/user-repository';
import { createRequireSession } from '../middleware/require-session';
import { errorResponse, successResponse } from '../api-response';

const MAX_TEXT = 100_000;
type FieldRule = { type: 'string' | 'integer'; required?: boolean; nullable?: boolean; max?: number; enum?: string[] };
const RULES: Record<ContentEntity, Record<string, FieldRule>> = {
  profiles: { userId: { type: 'integer', required: true }, name: { type: 'string', required: true, max: 100 }, title: { type: 'string', required: true, max: 100 }, bio: { type: 'string', required: true, max: MAX_TEXT }, avatarUrl: { type: 'string', nullable: true, max: 2000 }, cvUrl: { type: 'string', nullable: true, max: 2000 }, location: { type: 'string', nullable: true, max: 100 } },
  social_links: { profileId: { type: 'integer', required: true }, platform: { type: 'string', required: true, max: 50 }, url: { type: 'string', required: true, max: 2000 } },
  skills: { name: { type: 'string', required: true, max: 50 }, category: { type: 'string', required: true, max: 50 }, iconUrl: { type: 'string', nullable: true, max: 2000 } },
  experiences: { companyName: { type: 'string', required: true, max: 150 }, role: { type: 'string', required: true, max: 100 }, startDate: { type: 'string', required: true, max: 10 }, endDate: { type: 'string', nullable: true, max: 10 }, description: { type: 'string', nullable: true, max: MAX_TEXT } },
  blogs: { title: { type: 'string', required: true, max: 255 }, slug: { type: 'string', required: true, max: 255 }, content: { type: 'string', required: true, max: MAX_TEXT }, coverImageUrl: { type: 'string', nullable: true, max: 2000 }, status: { type: 'string', enum: ['draft', 'published'], max: 20 } },
  inbox_messages: { senderName: { type: 'string', required: true, max: 100 }, senderEmail: { type: 'string', required: true, max: 150 }, subject: { type: 'string', nullable: true, max: 200 }, message: { type: 'string', required: true, max: MAX_TEXT } }
};

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseBody(entity: ContentEntity, value: unknown, create: boolean): ContentRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const rules = RULES[entity];
  if (Object.keys(input).length === 0 || Object.keys(input).some((key) => !(key in rules))) return null;
  const result: ContentRecord = {};
  for (const [key, rule] of Object.entries(rules)) {
    if (!(key in input)) {
      if (create && rule.required) return null;
      continue;
    }
    const item = input[key];
    if (item === null && rule.nullable) { result[key] = null; continue; }
    if (rule.type === 'string') {
      if (typeof item !== 'string' || item.trim().length === 0 || item.length > (rule.max ?? MAX_TEXT)) return null;
      const normalized = item.trim();
      if (rule.enum && !rule.enum.includes(normalized)) return null;
      if ((key === 'startDate' || key === 'endDate') && !isDateOnly(normalized)) return null;
      if (key === 'senderEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized)) return null;
      if (['avatarUrl', 'cvUrl', 'iconUrl', 'coverImageUrl', 'url'].includes(key)) {
        try { if (!['http:', 'https:'].includes(new URL(normalized).protocol)) return null; } catch { return null; }
      }
      result[key] = normalized;
    } else {
      if (!Number.isSafeInteger(item) || Number(item) < 1) return null;
      result[key] = item;
    }
  }
  if (entity === 'blogs' && create && !('status' in result)) result.status = 'draft';
  for (const key of ['avatarUrl', 'cvUrl', 'location', 'iconUrl', 'endDate', 'description', 'coverImageUrl', 'subject'] as const) {
    if (create && key in rules && !(key in result)) result[key] = null;
  }
  return result;
}

export function createContentRoutes(dependencies: {
  contentFor: (context: Context<AppEnv>) => ContentService;
  usersFor: (context: Context<AppEnv>) => UserRepository;
}) {
  const routes = new Hono<AppEnv>();
  const requireSession = createRequireSession(dependencies.usersFor);

  async function list(c: Context<AppEnv>, entity: ContentEntity, publishedOnly = false) {
    return successResponse(c, await dependencies.contentFor(c).list(entity, { publishedOnly }));
  }
  async function get(c: Context<AppEnv>, entity: ContentEntity, publishedOnly = false) {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const item = await dependencies.contentFor(c).find(entity, id, { publishedOnly });
    return item ? successResponse(c, item) : errorResponse(c, 'resource_not_found', 404);
  }
  async function create(c: Context<AppEnv>, entity: ContentEntity) {
    const body = await c.req.json<unknown>().catch(() => null);
    const input = parseBody(entity, body, true);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    if (entity === 'experiences' && input.endDate !== null && String(input.endDate) < String(input.startDate)) return errorResponse(c, 'invalid_request', 400);
    try { return successResponse(c, await dependencies.contentFor(c).create(entity, input), 201); }
    catch (error) { return handleError(c, error); }
  }
  async function update(c: Context<AppEnv>, entity: ContentEntity) {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    const body = await c.req.json<unknown>().catch(() => null);
    const input = parseBody(entity, body, false);
    if (!input) return errorResponse(c, 'invalid_request', 400);
    if (entity === 'experiences' && ('startDate' in input || 'endDate' in input)) {
      const current = await dependencies.contentFor(c).find(entity, id);
      if (!current) return errorResponse(c, 'resource_not_found', 404);
      const startDate = String(input.startDate ?? current.startDate);
      const endDate = input.endDate === undefined ? current.endDate : input.endDate;
      if (endDate !== null && String(endDate) < startDate) return errorResponse(c, 'invalid_request', 400);
    }
    try {
      const item = await dependencies.contentFor(c).update(entity, id, input);
      return item ? successResponse(c, item) : errorResponse(c, 'resource_not_found', 404);
    } catch (error) { return handleError(c, error); }
  }
  async function remove(c: Context<AppEnv>, entity: ContentEntity) {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return errorResponse(c, 'invalid_id', 400);
    return await dependencies.contentFor(c).delete(entity, id) ? c.body(null, 204) : errorResponse(c, 'resource_not_found', 404);
  }
  function handleError(c: Context<AppEnv>, error: unknown) {
    if (error instanceof ContentRelationNotFoundError) return errorResponse(c, error.code, 404);
    if (error instanceof Error && /unique constraint failed/iu.test(error.message)) return errorResponse(c, 'resource_conflict', 409);
    throw error;
  }

  const standardEntities: Array<[ContentEntity, string]> = [['profiles', 'profiles'], ['social_links', 'social-links'], ['experiences', 'experiences']];
  for (const [entity, path] of standardEntities) {
    routes.get(`/${path}`, (c) => list(c, entity));
    routes.get(`/${path}/:id`, (c) => get(c, entity));
    routes.post(`/${path}`, requireSession, (c) => create(c, entity));
    routes.patch(`/${path}/:id`, requireSession, (c) => update(c, entity));
    routes.delete(`/${path}/:id`, requireSession, (c) => remove(c, entity));
  }
  routes.get('/blogs/admin', requireSession, (c) => list(c, 'blogs'));
  routes.get('/blogs/admin/:id', requireSession, (c) => get(c, 'blogs'));
  routes.get('/blogs', (c) => list(c, 'blogs', true));
  routes.get('/blogs/:id', (c) => get(c, 'blogs', true));
  routes.post('/blogs', requireSession, (c) => create(c, 'blogs'));
  routes.patch('/blogs/:id', requireSession, (c) => update(c, 'blogs'));
  routes.delete('/blogs/:id', requireSession, (c) => remove(c, 'blogs'));

  routes.get('/inbox-messages', requireSession, (c) => list(c, 'inbox_messages'));
  routes.get('/inbox-messages/:id', requireSession, (c) => get(c, 'inbox_messages'));
  routes.patch('/inbox-messages/:id', requireSession, (c) => update(c, 'inbox_messages'));
  routes.delete('/inbox-messages/:id', requireSession, (c) => remove(c, 'inbox_messages'));
  return routes;
}

