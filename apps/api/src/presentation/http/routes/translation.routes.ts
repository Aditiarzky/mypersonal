import { Hono } from 'hono';
import type { AppEnv } from '../../../types';
import { errorResponse, successResponse } from '../api-response';

const MODEL = '@cf/meta/m2m100-1.2b';
const MAX_TEXTS = 40;
const MAX_TEXT_LENGTH = 2_000;
const MAX_TOTAL_LENGTH = 12_000;
const CONCURRENCY = 4;

function readTexts(value: unknown): string[] | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('texts' in value) ||
    !Array.isArray(value.texts) ||
    value.texts.length === 0 ||
    value.texts.length > MAX_TEXTS
  ) {
    return null;
  }

  const texts: string[] = [];
  for (const text of value.texts) {
    if (
      typeof text !== 'string' ||
      text.trim().length === 0 ||
      text.length > MAX_TEXT_LENGTH
    ) {
      return null;
    }
    texts.push(text);
  }

  const totalLength = texts.reduce((total, text) => total + text.length, 0);
  return totalLength <= MAX_TOTAL_LENGTH ? texts : null;
}

function readTranslatedText(output: unknown): string {
  if (
    typeof output !== 'object' ||
    output === null ||
    !('translated_text' in output) ||
    typeof output.translated_text !== 'string' ||
    output.translated_text.trim().length === 0
  ) {
    throw new Error('Workers AI returned an invalid translation response.');
  }
  return output.translated_text;
}

export function createTranslationRoutes() {
  const routes = new Hono<AppEnv>();

  routes.post('/', async (c) => {
    if (c.req.header('Origin') !== c.env.FRONTEND_ORIGIN) {
      return errorResponse(c, 'invalid_origin', 403);
    }

    const clientIp = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const rateLimit = await c.env.TRANSLATION_LIMITER.limit({ key: clientIp });
    if (!rateLimit.success) return errorResponse(c, 'rate_limited', 429);

    const texts = readTexts(await c.req.json<unknown>().catch(() => null));
    if (!texts) return errorResponse(c, 'invalid_request', 400);

    const translations = new Array<string>(texts.length);
    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, texts.length) },
      async () => {
        while (cursor < texts.length) {
          const index = cursor++;
          const output = await c.env.AI.run(MODEL, {
            text: texts[index],
            source_lang: 'id',
            target_lang: 'en',
          });
          translations[index] = readTranslatedText(output);
        }
      },
    );
    await Promise.all(workers);

    return successResponse(c, { translations });
  });

  return routes;
}
