import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import type { UserRepository } from './domain/users/user-repository';
import { ProjectService } from './application/projects/project-service';
import { D1ProjectRepository } from './infrastructure/database/d1-project-repository';
import { D1UserRepository } from './infrastructure/database/d1-user-repository';
import { Pbkdf2PasswordHasher } from './infrastructure/security/pbkdf2-password-hasher';
import { createAuthRoutes } from './presentation/http/routes/auth.routes';
import { createProjectRoutes } from './presentation/http/routes/project.routes';
import { errorResponse, successResponse } from './presentation/http/api-response';

const app = new Hono<AppEnv>();
const passwords = new Pbkdf2PasswordHasher();
const usersFor = (c: Context<AppEnv>): UserRepository =>
  new D1UserRepository(c.env.portfoliod1);
const projectsFor = (c: Context<AppEnv>) =>
  new ProjectService(new D1ProjectRepository(c.env.portfoliod1));

app.onError((err, c) => {
  console.error('API request failed:', err);
  return errorResponse(c, 'internal_server_error', 500);
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
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 600
  })(c, next);
});

app.use('/api/*', async (c, next) => {
  const requestOrigin = c.req.header('Origin');
  const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method);
  if (isUnsafeMethod && requestOrigin && requestOrigin !== c.env.FRONTEND_ORIGIN) {
    return errorResponse(c, 'invalid_origin', 403);
  }
  await next();
});

app.get('/', (c) => c.html('API active. Check <a href="/api/health">/api/health</a>.'));
app.get('/api/health', (c) => successResponse(c, { status: 'ok' }));
app.route('/api/auth', createAuthRoutes({ usersFor, passwords }));
app.route('/api/projects', createProjectRoutes({ projectsFor, usersFor }));

app.notFound((c) => errorResponse(c, 'not_found', 404));

export default app;
