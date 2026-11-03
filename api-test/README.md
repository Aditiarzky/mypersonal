# HTTPyac API checks

These `.http` files exercise every route mounted in `apps/api/src/app.ts`, including CRUD methods and key validation/relationship conditions.

## Setup

1. Start the API and local D1 from the repository root: `bun run dev:api`.
2. Copy `.env.example` in this directory to `.env` and set `API_BASE_URL`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, and `TEST_USER_ID` for the local database. Do not commit `.env`.
3. In HTTPyac, run every request in a file from top to bottom. Login requests at the beginning establish the session cookie automatically for later requests in that file.

The profile and social-link request files create and delete a temporary profile. `TEST_USER_ID` must refer to an existing user without a profile. Requests create temporary skills, projects, and experiences; the files delete those fixtures at the end. If a run stops midway, delete its `HTTPyac ...` fixtures before rerunning.

Tests use HTTPyac response scripts and assertions. These are request-level integration checks; they require the API and local D1 to be running.
