export interface Bindings {
  portfoliod1: D1Database;
  AI: {
    run(
      model: string,
      input: { text: string; source_lang: string; target_lang: string },
    ): Promise<unknown>;
  };
  TRANSLATION_LIMITER: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
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