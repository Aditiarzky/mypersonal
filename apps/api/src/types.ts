export interface Bindings {
  portfoliod1: D1Database;
  FRONTEND_ORIGIN: string;
  AUTH_COOKIE_SECRET: string;
  COOKIE_SAME_SITE?: 'Lax' | 'None';
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    sessionUser: import('./domain/users/user').AuthenticatedUser;
  };
};