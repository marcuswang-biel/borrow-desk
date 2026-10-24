# Effect, Postgres, and Vercel

Borrow Desk is the reference shape for later Effect services. The backend is Effect v4 only. Convex was rejected because the next projects will not use it, and because the domain rules (overlap, permission, reminders) need to live in Effect services that tests can replace with memory layers.

## Database

SQLite would make the first clone easier, and the http-server example supports it, but production needs a hosted Postgres. Neon is the hosted Postgres: it has a free tier, a pooled connection for serverless, and it stays a normal Postgres so `@effect/sql-pg` and SQL migrations work unchanged. Local development uses a Postgres on the machine, never the Neon URL. The process dies if development sees a Neon host or production sees a local host.

Migrations are Effect SQL files in `packages/backend/src/sql/migrations`, named `<YYYYMMDDNN>_<name>.ts` and loaded from that directory when the API starts. A fresh clone only needs a database and `pnpm dev`.

## Auth

Neon Auth would host Better Auth for us, but then local sign-up would either share the production user table or grow a second hosted project. Self-hosted Better Auth uses whichever `DATABASE_URL` the process already has, so local users stay in local Postgres and production users stay in Neon.

## Where it runs

A long-running Node process is the natural place for `Schedule`. Fly or a VPS would keep that fiber up. Vercel is the free static-plus-function host already used for the page, and it can run the Effect fetch handler. The reminder fiber stays in `pnpm dev` / `main.ts`. The Vercel handler does not start it, because a serverless invocation would not keep the schedule alive. The scan itself is one Effect, so a later cron can call it without a second implementation.

## UI

React 19 and Vite match the required frontend. The browser does not hand-write fetch calls for loans; it uses the HttpApi client generated from `packages/api`.
