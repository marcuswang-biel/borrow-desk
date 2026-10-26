# Borrow Desk

Equipment lending. An admin records equipment. A signed-in person books a time range. Overlapping bookings fail and name the other borrower. A one-minute schedule reminds the borrower when a loan is overdue and not returned.

This repository does not use Convex. The backend is Effect v4.

## Layout

`packages/api` is the shared Schema and HttpApi. It imports only `effect`.

`packages/backend` follows the http-server split. Product features live in `src/features`: each folder holds Policy, the use-case service, and Http, and exposes them from `index.ts`. Repositories live in `src/repo`: each concept has its own folder, with the port and the SQL implementation exposed from that folder's `index.ts`. The folder is also exposed from `src/repo/index.ts`. In-memory repositories used by tests live in `packages/backend/test`. PostgreSQL connection and migrations live in `src/sql` and are exposed from `src/sql/index.ts`. Migration files are named `<YYYYMMDDNN>_<name>.ts` and loaded from `src/sql/migrations`. Better Auth is mounted at `/api/auth` and exposed from `src/auth/index.ts`.

`packages/frontend` is React 19. It calls the API through `HttpApiClient` generated from `packages/api`. `src/auth` is the session and the sign-in panel, and other folders import that folder's `index.ts`. `src/components` is the frame and the session gate. `src/lib` is the client, the shared failures, and the languages. `src/routes` is one file per page.

## Commands

`pnpm dev` checks the local environment, then Turbo starts the API on port 3000 and the page on port 5173. The page proxies `/api` to the API so the session cookie stays on one origin.

`pnpm test` runs the overlap, permission, and overdue tests with in-memory repositories.

`pnpm fmt` formats. `pnpm lint` lints.

## Environments

Development reads `.env.development` and must use local PostgreSQL. Production reads `.env.production` and must use the Neon pooler. The server dies if the pair does not match.

## Comments

Comments in code are English. Every exported function and module-level binding has one.

## Further reading

Setup is in `README.md`. Words are in `CONTEXT.md`. Auth is in `docs/auth.md`. The runtime choice is in `docs/adr/0001-effect-postgres-vercel.md`.
