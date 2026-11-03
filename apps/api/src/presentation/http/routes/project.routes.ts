import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { ProjectRepository } from '../../../domain/projects/project-repository';
import { ProjectSkillsNotFoundError } from '../../../domain/projects/project-repository';
import type { CreateProjectInput, UpdateProjectInput } from '../../../domain/projects/project';
import { ProjectService, ProjectSlugConflictError } from '../../../application/projects/project-service';
import type { UserRepository } from '../../../domain/users/user-repository';
import { createRequireSession } from '../middleware/require-session';
import { errorResponse as apiErrorResponse, successResponse } from '../api-response';

const MAX_URL_LENGTH = 2_000;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, maxLength: number, allowNull = false): string | null | undefined {
  if (allowNull && value === null) return null;
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) return undefined;
  return value.trim();
}

function readImages(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.some((url) => typeof url !== 'string' || url.trim().length === 0 || url.length > MAX_URL_LENGTH)) return undefined;
  return value.map((url) => (url as string).trim());
}

function readSkillIds(value: unknown): number[] | undefined {
  if (!Array.isArray(value) || value.some((id) => !Number.isSafeInteger(id) || id < 1)) return undefined;
  return [...new Set(value as number[])];
}

function parseCreateInput(value: unknown): CreateProjectInput | null {
  if (!isObject(value)) return null;
  const title = readText(value.title, 150);
  const slug = readText(value.slug, 150);
  const description = readText(value.description, 100_000);
  const thumbnailUrl = value.thumbnailUrl === undefined ? null : readText(value.thumbnailUrl, MAX_URL_LENGTH, true);
  const images = value.images === undefined || value.images === null ? null : readImages(value.images);
  const demoUrl = value.demoUrl === undefined ? null : readText(value.demoUrl, MAX_URL_LENGTH, true);
  const sourceCodeUrl = value.sourceCodeUrl === undefined ? null : readText(value.sourceCodeUrl, MAX_URL_LENGTH, true);
  const orderPosition = value.orderPosition === undefined ? 0 : value.orderPosition;
  const skillIds = value.skillIds === undefined ? [] : readSkillIds(value.skillIds);

  if (
    typeof title !== 'string' || typeof slug !== 'string' || typeof description !== 'string' ||
    thumbnailUrl === undefined || images === undefined || demoUrl === undefined || sourceCodeUrl === undefined ||
    !Number.isSafeInteger(orderPosition) || skillIds === undefined
  ) return null;

  return {
    title,
    slug,
    description,
    thumbnailUrl,
    images,
    demoUrl,
    sourceCodeUrl,
    orderPosition: orderPosition as number,
    skillIds
  };
}

function parseUpdateInput(value: unknown): UpdateProjectInput | null {
  if (!isObject(value)) return null;
  const allowed = new Set(['title', 'slug', 'description', 'thumbnailUrl', 'images', 'demoUrl', 'sourceCodeUrl', 'orderPosition', 'skillIds']);
  if (Object.keys(value).some((key) => !allowed.has(key)) || Object.keys(value).length === 0) return null;

  const result: UpdateProjectInput = {};
  for (const key of ['title', 'slug', 'description'] as const) {
    if (key in value) {
      const max = key === 'title' ? 150 : key === 'slug' ? 150 : 100_000;
      const text = readText(value[key], max);
      if (typeof text !== 'string') return null;
      result[key] = text;
    }
  }
  if ('images' in value) {
    const images = value.images === null ? null : readImages(value.images);
    if (images === undefined) return null;
    result.images = images;
  }
  for (const key of ['thumbnailUrl', 'demoUrl', 'sourceCodeUrl'] as const) {
    if (key in value) {
      const text = readText(value[key], MAX_URL_LENGTH, true);
      if (text === undefined) return null;
      result[key] = text;
    }
  }
  if ('orderPosition' in value) {
    if (!Number.isSafeInteger(value.orderPosition)) return null;
    result.orderPosition = value.orderPosition as number;
  }
  if ('skillIds' in value) {
    const skillIds = readSkillIds(value.skillIds);
    if (skillIds === undefined) return null;
    result.skillIds = skillIds;
  }
  return result;
}

async function jsonBody(c: Context<AppEnv>): Promise<unknown> {
  return c.req.json<unknown>().catch(() => null);
}

function projectErrorResponse(c: Context<AppEnv>, error: unknown) {
  if (error instanceof ProjectSkillsNotFoundError) {
    return apiErrorResponse(c, 'unknown_skill_ids', 400, { details: { skillIds: error.skillIds } });
  }
  if (error instanceof ProjectSlugConflictError) {
    return apiErrorResponse(c, 'slug_conflict', 409);
  }
  throw error;
}

export function createProjectRoutes(dependencies: {
  projectsFor: (context: Context<AppEnv>) => ProjectService;
  usersFor: (context: Context<AppEnv>) => UserRepository;
}) {
  const routes = new Hono<AppEnv>();
  const requireSession = createRequireSession(dependencies.usersFor);

  routes.get('/', async (c) => {
    const projects = await dependencies.projectsFor(c).list();
    return successResponse(c, projects);
  });

  routes.get('/:slug', async (c) => {
    const project = await dependencies.projectsFor(c).getBySlug(c.req.param('slug'));
    if (!project) return apiErrorResponse(c, 'project_not_found', 404);
    return successResponse(c, project);
  });

  routes.post('/', requireSession, async (c) => {
    const input = parseCreateInput(await jsonBody(c));
    if (!input) return apiErrorResponse(c, 'invalid_request', 400);
    try {
      const project = await dependencies.projectsFor(c).create(input);
      return successResponse(c, project, 201);
    } catch (error) {
      return projectErrorResponse(c, error);
    }
  });

  routes.patch('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return apiErrorResponse(c, 'invalid_project_id', 400);
    const input = parseUpdateInput(await jsonBody(c));
    if (!input) return apiErrorResponse(c, 'invalid_request', 400);
    try {
      const project = await dependencies.projectsFor(c).update(id, input);
      if (!project) return apiErrorResponse(c, 'project_not_found', 404);
      return successResponse(c, project);
    } catch (error) {
      return projectErrorResponse(c, error);
    }
  });

  routes.delete('/:id', requireSession, async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isSafeInteger(id) || id < 1) return apiErrorResponse(c, 'invalid_project_id', 400);
    const deleted = await dependencies.projectsFor(c).delete(id);
    if (!deleted) return apiErrorResponse(c, 'project_not_found', 404);
    return c.body(null, 204);
  });

  return routes;
}



