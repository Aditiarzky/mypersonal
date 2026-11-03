import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../../../types';
import type { PasswordHasher } from '../../../domain/auth/password-hasher';
import type { UserRepository } from '../../../domain/users/user-repository';
import { authenticateUser } from '../../../application/auth/authenticate-user';
import { createRequireSession } from '../middleware/require-session';
import { clearSessionCookie, issueSessionCookie } from '../session-cookie';
import { errorResponse, successResponse } from '../api-response';

export function createAuthRoutes(dependencies: {
  usersFor: (context: Context<AppEnv>) => UserRepository;
  passwords: PasswordHasher;
}) {
  const authRoutes = new Hono<AppEnv>();
  const requireSession = createRequireSession(dependencies.usersFor);

  authRoutes.post('/login', async (c) => {
    const input = await c.req.json<unknown>().catch(() => null);
    if (
      typeof input !== 'object' ||
      input === null ||
      !('email' in input) ||
      !('password' in input) ||
      typeof input.email !== 'string' ||
      typeof input.password !== 'string' ||
      input.email.length > 150 ||
      input.password.length === 0 ||
      new TextEncoder().encode(input.password).length > 1024
    ) {
      return errorResponse(c, 'invalid_request', 400);
    }

    const user = await authenticateUser(
      { email: input.email, password: input.password },
      { users: dependencies.usersFor(c), passwords: dependencies.passwords }
    );

    if (!user) {
      return errorResponse(c, 'invalid_credentials', 401);
    }

    await issueSessionCookie(c, user.id);
    return successResponse(c, { user });
  });

  authRoutes.get('/session', requireSession, (c) => {
    return successResponse(c, { user: c.get('sessionUser') });
  });

  authRoutes.post('/logout', (c) => {
    clearSessionCookie(c);
    return successResponse(c, { loggedOut: true });
  });

  return authRoutes;
}

