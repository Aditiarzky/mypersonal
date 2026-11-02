import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { UserRepository } from '../../../domain/users/user-repository';
import { readSessionCookie } from '../session-cookie';

export function createRequireSession(
  usersFor: (context: Context<AppEnv>) => UserRepository
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = await readSessionCookie(c);
    if (!session) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    const user = await usersFor(c).findById(session.userId);
    if (!user) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    c.set('sessionUser', user);
    await next();
  });
}