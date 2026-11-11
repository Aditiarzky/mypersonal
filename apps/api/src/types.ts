export interface Bindings {
  portfoliod1: D1Database;
  AI: {
    run(
      model: string,
      input: {
        messages: { role: 'system' | 'user'; content: string }[];
        response_format: {
          type: 'json_schema';
          json_schema: {
            name: string;
            schema: Record<string, unknown>;
          };
        };
        temperature: number;
        max_tokens: number;
      },
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