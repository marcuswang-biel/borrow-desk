# Deploy Borrow Desk with Neon and Vercel

This repository deploys the React page and `/api` handler to Vercel. PostgreSQL is hosted by Neon. The API applies the business SQL migrations and Better Auth migrations when its serverless handler starts; do not paste the migration TypeScript into Neon SQL Editor.

## 1. Create or select a Neon database

1. Open the [Neon Console](https://console.neon.tech/) and create a project, or select the intended project.
2. In **Connect**, choose the correct branch, database (normally `neondb`) and role.
3. Copy the **pooled** connection string. The hostname must contain `-pooler` (for example `ep-...-pooler...neon.tech`) and the URL should include `sslmode=require`.
4. Keep the complete URI private. Never commit it to GitHub or paste it in an issue or chat.

Do not delete/recreate a production Neon database just to retry deployment. The migration runner tracks which migrations have already run.

## 2. Set Vercel Production environment variables

In Vercel, open the **borrow-desk** project → **Settings** → **Environment Variables**. Add the following for the **Production** environment. Preview should use a separate Neon branch/database if you enable database-backed preview deployments.

| Name | Value |
| --- | --- |
| `APP_ENV` | `production` |
| `DATABASE_URL` | The full pooled Neon connection string from step 1 |
| `AUTH_PUBLIC_URL` | The exact canonical public origin, e.g. `https://borrow-desk.vercel.app`, with no trailing slash. Use your own production domain if different. |
| `BETTER_AUTH_SECRET` | A fresh random secret (at least 32 random bytes); on macOS/Linux, generate with `openssl rand -base64 32` |
| `ADMIN_EMAIL` | The email address(es) that should be admins, comma-separated; use the address you will sign in with |
| `PG_PREPARE` | `false` |
| `PG_MAX_CONNECTIONS` | `1` |
| `PG_IDLE_TIMEOUT` | `10 seconds` |

Do not set `DATABASE_URL` to the direct (non-pooler) Neon endpoint. The serverless app validates that the host is a Neon pooler. `PORT` is for local development and is not required by the Vercel fetch handler after the authentication startup fix. `NEON_AUTH_BASE_URL` and `VITE_NEON_AUTH_URL` are not used by this application; it uses its own Better Auth setup.

## 3. Redeploy after saving variables

Vercel does not retroactively apply environment-variable changes to an existing deployment. After saving the variables, open **Deployments** and redeploy the latest production deployment, or push a commit to the configured production branch. Ensure the deployment uses the Production environment and finishes successfully.

## 4. Verify database and authentication

1. Request `https://YOUR_PRODUCTION_DOMAIN/api/auth/get-session`. An unauthenticated request should return a successful response with no session; a 500 response means the API runtime logs should be inspected.
2. In Neon SQL Editor, run:

   ```sql
   select
     to_regclass('public.equipment') as equipment,
     to_regclass('public.loans') as loans,
     to_regclass('public.reminders') as reminders;
   ```

   After the first successful API initialization, all three values should be the matching table names rather than `NULL`.
3. Sign up and sign in with the address listed in `ADMIN_EMAIL`. Verify that you can add equipment, refresh the page, and still see it. Create a second non-admin account to verify role restrictions.
4. If the request fails, open Vercel → project → **Logs** and inspect the runtime error. Check `APP_ENV`, the pooler host, whether `AUTH_PUBLIC_URL` exactly matches the public domain, and whether all variables were set for **Production**. Do not share the connection string or signing secret when reporting an error.

## Known production note

The one-minute reminder schedule runs in the long-running local server, not in a Vercel serverless invocation. Database deployment does not activate that schedule; production overdue reminders need a separate scheduler calling the existing `scanOverdue` use case.
