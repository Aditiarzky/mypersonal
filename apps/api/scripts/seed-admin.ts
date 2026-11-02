import { Pbkdf2PasswordHasher } from '../src/infrastructure/security/pbkdf2-password-hasher';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const email = Bun.env.ADMIN_EMAIL?.trim().toLowerCase();
const name = Bun.env.ADMIN_NAME?.trim() || 'Admin';
const password = Bun.env.ADMIN_PASSWORD;
const targetArgs = process.argv.filter((arg) => arg === '--local' || arg === '--remote');
const target = targetArgs.at(-1) ?? '--local';

if (targetArgs.length > 1) {
  throw new Error('Choose either --local or --remote.');
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
  throw new Error('Set a valid ADMIN_EMAIL (maximum 150 characters).');
}
if (!password) {
  throw new Error('Set ADMIN_PASSWORD in the environment or apps/api/.env.');
}
if (name.length > 100) {
  throw new Error('ADMIN_NAME must be 100 characters or fewer.');
}

const passwordHash = await new Pbkdf2PasswordHasher().hash(password);
const quoteSql = (value: string) => `'${value.replaceAll("'", "''")}'`;
const sql = `INSERT INTO users (name, email, password)
VALUES (${quoteSql(name)}, ${quoteSql(email)}, ${quoteSql(passwordHash)})
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  password = excluded.password;\n`;

const workDir = resolve(apiRoot, '.wrangler');
const sqlFile = resolve(workDir, `seed-admin-${crypto.randomUUID()}.sql`);
const wranglerBin = resolve(apiRoot, 'node_modules/wrangler/bin/wrangler.js');

await mkdir(workDir, { recursive: true });
await writeFile(sqlFile, sql, { encoding: 'utf8', mode: 0o600 });

try {
  const processHandle = Bun.spawn(
    [process.execPath, wranglerBin, 'd1', 'execute', 'portfoliod1', target, '--file', sqlFile],
    { cwd: apiRoot, stdout: 'inherit', stderr: 'inherit' }
  );
  const exitCode = await processHandle.exited;
  if (exitCode !== 0) {
    throw new Error(`Wrangler D1 seed failed with exit code ${exitCode}.`);
  }
  console.log(`Admin seed completed (${target.slice(2)} database).`);
} finally {
  await rm(sqlFile, { force: true });
}