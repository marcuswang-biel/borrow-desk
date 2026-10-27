# Borrow Desk architecture and platform choices

## Context

Borrow Desk is an equipment-lending app. An admin records equipment; a signed-in employee books one piece for a half-open time range. Overlapping open loans fail with `LoanConflict`, which names the earlier borrower. A loan that ends without a return produces one reminder for its borrower. The project is a from-scratch Effect v4 application: shared Schema and HttpApi, tagged errors in signatures, replaceable database, clock, and reminder services, SQL migrations, a scheduled overdue scan, and `@effect/vitest` coverage. It must run on free personal accounts.

## Layout

```text
packages/api
  src/api/groups/*       HttpApi groups
  src/schema/*           shared Schema and tagged errors
  src/policy/*           pure rules
packages/backend
  src/features/*         Policy, use case, and Http for one feature
  src/repo/*             repository port and SQL implementation
  src/sql                client, migrations, and migrator
  src/auth               Better Auth
  test                   in-memory repositories and @effect/vitest
packages/frontend
  src/auth               session and sign-in
  src/components         frame and session gate
  src/lib                client, failures, and languages
  src/routes             one file per page
```

`packages/api` imports only `effect`. The backend split follows Effect's http-server example; where that v3 example and the v4 docs differ, the v4 docs win. The frontend calls the API through `HttpApiClient` generated from the shared contract. Tests replace the SQL repositories with in-memory Layers.

## Decision

Use one pnpm and Turbo workspace with three packages: an Effect v4 backend, a shared Schema and HttpApi contract, and a React and Vite page. Persist in Neon Postgres through `@effect/sql`, deploy the page and one fetch function to Vercel, and authenticate with Better Auth. The table records the alternatives and why they lost.

## Options

| Area            | Considered                                                                                                   | Chosen                   | Why                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend runtime | Effect v4; Convex; Fastify or Hono; NestJS                                                                   | Effect v4                | One typed system covers services, HTTP, SQL, Schedule, and tests. Convex would move domain rules to a vendor runtime and make local memory-Layer tests harder.                 |
| Contract        | Effect HttpApi + Schema; tRPC; OpenAPI + codegen; hand-written fetch                                         | HttpApi + Schema         | The browser client is generated from the same contract. Request, response, and tagged errors share Schema, and failures stay in the effect signature.                          |
| Persistence     | Postgres + `@effect/sql-pg` + Effect migrations; SQLite or Turso; Prisma or Drizzle; Supabase or PlanetScale | Postgres + `@effect/sql` | Production needs hosted Postgres. The SQL client and migrator are Effect services, so no second ORM runtime or transaction model is added.                                     |
| Hosting         | Vercel + Neon; Fly, Render, or Railway; a VPS                                                                | Vercel + Neon            | Vercel's free static-plus-function host fits the React page; Neon's free pooled Postgres fits the serverless function.                                                         |
| Frontend        | React 19 + Vite; Next.js; Remix; SvelteKit                                                                   | React 19 + Vite          | The page is a static client for one API. Vite builds a small SPA and `HttpApiClient` supplies the typed calls; Next.js or Remix would add a server layer the API already owns. |
| Auth            | Better Auth; Clerk or Auth0; Neon Auth                                                                       | Better Auth              | Users stay in the same Postgres database. Clerk or Auth0 would move them to another vendor, and Neon Auth would host a second auth project.                                    |
| Tests           | In-memory Layers; real Postgres or testcontainers                                                            | In-memory Layers         | Overlap, permission, and overdue tests stay fast and deterministic, with `TestClock` controlling time.                                                                         |
| Tooling         | pnpm + Turbo; one package; Nx                                                                                | pnpm + Turbo             | A small explicit workspace shares packages and caches builds without another framework.                                                                                        |

The workspace runs Node 24 with pnpm 12 and Turbo. TypeScript project references connect the packages. The page uses React 19, Vite 8, Tailwind 4, react-router, and i18next; tests use Vitest 5 with `@effect/vitest`; oxlint and oxfmt handle linting and formatting.

## Consequences

- The contract is typed end to end. Domain failures are tagged errors in the service and endpoint signatures; no domain error is thrown.
- The memory tests do not exercise the SQL implementations, migrations, or Neon. Those are thin and verified against the deployed database; a Postgres integration test is the next addition if the schema grows.
- Vercel's plain `api` directory matches only one dynamic segment. A rewrite sends every `/api` request to one fetch handler, which exports the Web Handler shape `{ fetch }`. The shared API package is built to JavaScript and migrations are static imports, so the function bundle does not depend on TypeScript sources or a runtime migrations directory.
- The overdue `Schedule` runs in the long-running Node process (`pnpm dev` and `main.ts`). A Vercel function does not keep that fiber alive, so the function also exposes `GET /api/internal/overdue`, protected by `CRON_SECRET`. Vercel's Hobby cron calls it daily; a minute-level external scheduler can call the same path for the original cadence. Fly, Render, or Railway would run the fiber itself.
- Neon suspends an idle compute. The function allows 30 seconds for a cold connect and recycles sessions after 5 minutes; the stock 5-second timeout can expire while the pooler waits for PostgreSQL to answer.
- Production must use the Neon pooler with `PG_PREPARE=false` and `PG_MAX_CONNECTIONS=1`. Development must use local PostgreSQL. The process refuses to start when the pair does not match.
- The role is derived from `ADMIN_EMAIL` when the token is verified, not stored by Better Auth. Changing admins is an environment change.
- The page and the API share an origin, through the Vite proxy in development and the same domain in production, so the session cookie stays first-party.
