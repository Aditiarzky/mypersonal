# Repository Guidelines

## Project Structure

This Bun workspace contains the SvelteKit frontend in `apps/web` and the Hono Cloudflare Worker API in `apps/api`. API code follows layered architecture: `domain`, `application`, `infrastructure`, and `presentation/http`. D1 migrations live in `apps/api/migrations`; API route handlers live in `apps/api/src/presentation/http/routes`.

## Development Commands

Run `bun install` at the repository root. Start local services with `bun run dev:web` and `bun run dev:api`. Run `bun run check:web` and `bun run check:api` for type and framework checks. Apply local D1 migrations with `bun run db:migrate:local`; seed the local admin with `bun run seed:admin:local` after configuring `apps/api/.env` and `apps/api/.dev.vars` from their example files.

## Style and Changes

Follow the surrounding TypeScript style: two-space indentation, single quotes, semicolons, camelCase values/functions, and PascalCase types/classes. Keep HTTP concerns in presentation routes and business logic in application/domain layers. Add database changes as a new numbered migration; do not rewrite migrations already applied remotely.

## API Documentation

Whenever an endpoint is added, removed, or changed, update `docs/API.md` in the same change. Document method, path, authentication, request validation/body, success response, and relevant errors. Confirm mounted routes in `apps/api/src/app.ts` and handlers under `apps/api/src/presentation/http/routes/`.

## Verification and Pull Requests

Run the relevant check command for changed apps. Keep changes focused and describe behavior, configuration or migration impact, and verification performed in the pull request. Never commit `.env`, `.dev.vars`, passwords, or runtime secrets.
