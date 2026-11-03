import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { UserRepository } from '../../../domain/users/user-repository';
import { readSessionCookie } from '../session-cookie';
import { errorResponse } from '../api-response';

export function createRequireSession(
  usersFor: (context: Context<AppEnv>) => UserRepository
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = await readSessionCookie(c);
    if (!session) {
      return errorResponse(c, 'unauthorized', 401);
    }

    const user = await usersFor(c).findById(session.userId);
    if (!user) {
      return errorResponse(c, 'unauthorized', 401);
    }

    c.set('sessionUser', user);
    await next();
  });
}

