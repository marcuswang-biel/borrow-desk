# Borrow Desk

An admin records a piece of equipment. An employee books it for a time range. If that range overlaps an open loan, the API returns `LoanConflict` with the other borrower's name. Once a minute, the API records one note when a loan has ended and is still out. The borrower opens Reminders in the header to read it. The note names the equipment kind and number, and a second scan does not write another note. The page splits that work across a sign-in route, an equipment route, and a loans route. The same chrome can be read in English or Chinese.

## Local setup

1. Install pnpm 12 and Node 24.
2. `pnpm setup`. It writes `.env.development` and `.env.production` from `.env.example`, keeps values already present, and creates the local `borrow_desk` database.
3. Set `ADMIN_EMAIL` to the admin addresses, separated by commas. The example uses `ada@example.com,bob@example.com`. Every other account is an employee.
4. `pnpm install`
5. `pnpm dev`

That one command starts the API at http://localhost:3000 and the page at http://localhost:5173. Migrations run when the API starts, including the Better Auth tables.

## Production

Production uses a separate Neon pooled database and `AUTH_PUBLIC_URL` of the deployed site. Set `BETTER_AUTH_SECRET` there. Do not point `.env.development` at Neon.

Follow [the Neon + Vercel deployment guide](docs/deploy-neon-vercel.md) for the required environment variables and verification steps.

The page and the API deploy together on Vercel. The long-running `pnpm dev` process runs the reminder `Schedule`. A Vercel function does not keep that fiber alive; run the same `scanOverdue` from a scheduler if you need production reminders.

## Tests

`pnpm test` covers an employee being refused equipment creation, an overlapping loan naming the other person, a touching range being allowed, a missing equipment id, one overdue reminder that names the equipment, and a borrower seeing only their own note.
