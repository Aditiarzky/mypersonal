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
import { SkillService } from './application/skills/skill-service';
import { D1SkillRepository } from './infrastructure/database/d1-skill-repository';
import { createSkillRoutes } from './presentation/http/routes/skill.routes';
import { ProfileService } from './application/profiles/profile-service';
import { D1ProfileRepository } from './infrastructure/database/d1-profile-repository';
import { createProfileRoutes } from './presentation/http/routes/profile.routes';
import { SocialLinkService } from './application/social-links/social-link-service';
import { D1SocialLinkRepository } from './infrastructure/database/d1-social-link-repository';
import { createSocialLinkRoutes } from './presentation/http/routes/social-link.routes';
import { ProjectSkillService } from './application/project-skills/project-skill-service';
import { D1ProjectSkillRepository } from './infrastructure/database/d1-project-skill-repository';
import { createProjectSkillRoutes } from './presentation/http/routes/project-skill.routes';
import { ExperienceService } from './application/experiences/experience-service';
import { D1ExperienceRepository } from './infrastructure/database/d1-experience-repository';
import { createExperienceRoutes } from './presentation/http/routes/experience.routes';
import { errorResponse, successResponse } from './presentation/http/api-response';

const app = new Hono<AppEnv>();
const passwords = new Pbkdf2PasswordHasher();
const usersFor = (c: Context<AppEnv>): UserRepository =>
  new D1UserRepository(c.env.portfoliod1);
const projectsFor = (c: Context<AppEnv>) =>
  new ProjectService(new D1ProjectRepository(c.env.portfoliod1));
const skillsFor = (c: Context<AppEnv>) =>
  new SkillService(new D1SkillRepository(c.env.portfoliod1));
const profilesFor = (c: Context<AppEnv>) =>
  new ProfileService(new D1ProfileRepository(c.env.portfoliod1));
const linksFor = (c: Context<AppEnv>) =>
  new SocialLinkService(new D1SocialLinkRepository(c.env.portfoliod1));
const projectSkillsFor = (c: Context<AppEnv>) =>
  new ProjectSkillService(new D1ProjectSkillRepository(c.env.portfoliod1));
const experiencesFor = (c: Context<AppEnv>) =>
  new ExperienceService(new D1ExperienceRepository(c.env.portfoliod1));

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
    return errorResponse(c, 'server_configuration_error', 500, { message: 'FRONTEND_ORIGIN is required for browser-origin requests.' });
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
app.route('/api/skills', createSkillRoutes({ skillsFor, usersFor }));
app.route('/api/profiles', createProfileRoutes({ profilesFor, usersFor }));
app.route('/api/social-links', createSocialLinkRoutes({ linksFor, usersFor }));
app.route('/api/projects', createProjectSkillRoutes({ projectSkillsFor, usersFor }));
app.route('/api/experiences', createExperienceRoutes({ experiencesFor, usersFor }));

app.notFound((c) => errorResponse(c, 'not_found', 404));

export default app;


