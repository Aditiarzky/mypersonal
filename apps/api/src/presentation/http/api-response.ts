import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from '../../types';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  error: string;
  message?: string;
  details?: unknown;
}

export function successResponse<T>(
  c: Context<AppEnv>,
  data: T,
  status: ContentfulStatusCode = 200,
  message?: string
) {
  const body: ApiSuccess<T> = { success: true, data, ...(message ? { message } : {}) };
  return c.json(body, status);
}

export function errorResponse(
  c: Context<AppEnv>,
  error: string,
  status: ContentfulStatusCode,
  options: { message?: string; details?: unknown } = {}
) {
  const body: ApiFailure = {
    success: false,
    error,
    ...(options.message ? { message: options.message } : {}),
    ...(options.details !== undefined ? { details: options.details } : {})
  };
  return c.json(body, status);
}
