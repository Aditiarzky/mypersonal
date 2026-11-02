import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { AppEnv } from '../../types';

export const SESSION_COOKIE_NAME = 'portfolio_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function getSessionSecret(secret: string | undefined): string {
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error('AUTH_COOKIE_SECRET must contain at least 32 bytes.');
  }
  return secret;
}

export async function issueSessionCookie(
  c: Context<AppEnv>,
  userId: number
): Promise<void> {
  const secret = getSessionSecret(c.env.AUTH_COOKIE_SECRET);
  const secure = new URL(c.req.url).protocol === 'https:';
  const sameSite = c.env.COOKIE_SAME_SITE ?? 'Lax';

  if (sameSite === 'None' && !secure) {
    throw new Error('SameSite=None cookies require HTTPS.');
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  await setSignedCookie(
    c,
    SESSION_COOKIE_NAME,
    `${userId}.${expiresAt}`,
    secret,
    {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: SESSION_TTL_SECONDS
    }
  );
}

export async function readSessionCookie(
  c: Context<AppEnv>
): Promise<{ userId: number; expiresAt: number } | null> {
  const secret = getSessionSecret(c.env.AUTH_COOKIE_SECRET);
  const value = await getSignedCookie(c, secret, SESSION_COOKIE_NAME);
  if (!value) return null;

  const match = /^(\d+)\.(\d+)$/.exec(value);
  if (!match) return null;

  const userId = Number(match[1]);
  const expiresAt = Number(match[2]);
  if (!Number.isSafeInteger(userId) || userId < 1 || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { userId, expiresAt };
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  const secure = new URL(c.req.url).protocol === 'https:';
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/', secure });
}