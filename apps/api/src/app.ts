import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import type { UserRepository } from './domain/users/user-repository';
import { D1UserRepository } from './infrastructure/database/d1-user-repository';
import { Pbkdf2PasswordHasher } from './infrastructure/security/pbkdf2-password-hasher';
import { createAuthRoutes } from './presentation/http/routes/auth.routes';

const app = new Hono<AppEnv>();
const passwords = new Pbkdf2PasswordHasher();
const usersFor = (c: Context<AppEnv>): UserRepository =>
  new D1UserRepository(c.env.portfoliod1);

app.onError((err, c) => {
  console.error('API request failed:', err);
  return c.json({ error: 'internal_server_error' }, 500);
});
app.use('/api/*', async (c, next) => {
  const requestOrigin = c.req.header('Origin');
  if (!requestOrigin) {
    await next();
    return;
  }

  const frontendOrigin = c.env.FRONTEND_ORIGIN?.trim();
  if (!frontendOrigin) {
    return c.json({
      error: 'server_configuration_error',
      message: 'FRONTEND_ORIGIN is required for browser-origin requests.'
    }, 500);
  }

  return cors({
    origin: frontendOrigin,
    credentials: true,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 600
  })(c, next);
});

app.use('/api/*', async (c, next) => {
  const requestOrigin = c.req.header('Origin');
  const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method);
  if (isUnsafeMethod && requestOrigin && requestOrigin !== c.env.FRONTEND_ORIGIN) {
    return c.json({ error: 'invalid_origin' }, 403);
  }
  await next();
});



app.get('/', (c) => c.html('API active. Check <a href="/api/health">/api/health</a>.'));
app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.route(
  '/api/auth',
  createAuthRoutes({ usersFor, passwords })
);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;
