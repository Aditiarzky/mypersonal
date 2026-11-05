import type { PasswordHasher } from '../../domain/auth/password-hasher';

const HASH_PREFIX = 'pbkdf2';
// Cloudflare Workers Web Crypto rejects PBKDF2 iteration counts above 100,000.
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const DERIVED_KEY_BITS = 128;
const DERIVED_KEY_BYTES = DERIVED_KEY_BITS / 8;
const MAX_PASSWORD_BYTES = 1024;
const textEncoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const result = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    key,
    DERIVED_KEY_BITS
  );
  return new Uint8Array(result);
}

export class Pbkdf2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const passwordBytes = textEncoder.encode(password).length;
    if (passwordBytes === 0 || passwordBytes > MAX_PASSWORD_BYTES) {
      throw new Error('Admin password must be 1 to 1024 UTF-8 bytes.');
    }

    const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(SALT_BYTES)));
    const derivedKey = await derive(password, salt);
    return `${HASH_PREFIX}$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(derivedKey)}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    if (password.length === 0 || textEncoder.encode(password).length > MAX_PASSWORD_BYTES) {
      return false;
    }

    const match = /^pbkdf2\$(\d{6})\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{22})$/u.exec(passwordHash);
    if (!match || Number(match[1]) !== ITERATIONS) return false;

    try {
      const salt = fromBase64Url(match[2]);
      const expected = fromBase64Url(match[3]);
      if (salt.length !== SALT_BYTES || expected.length !== DERIVED_KEY_BYTES) return false;

      const actual = await derive(password, salt);
      let difference = 0;
      for (let index = 0; index < expected.length; index += 1) {
        difference |= expected[index] ^ actual[index];
      }
      return difference === 0;
    } catch {
      return false;
    }
  }
}