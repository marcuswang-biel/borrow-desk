# Borrow Desk

An admin records a piece of equipment. An employee books it for a time range. If that range overlaps an open loan, the API returns `LoanConflict` with the other borrower's name. Once a minute, the API reminds the borrower of any loan that ended and was not returned.

## Local setup

1. Install pnpm 12 and Node 24.
2. Copy `.env.example` to `.env.development`.
3. Point `DATABASE_URL` at a local PostgreSQL database named `borrow_desk`.
4. Set `ADMIN_EMAIL` to the email you will sign up with. The example uses `ada@example.com`. That account is the admin. Every other account is an employee.
5. `pnpm install`
6. `pnpm dev`

That one command starts the API at http://localhost:3000 and the page at http://localhost:5173. Migrations run when the API starts, including the Better Auth tables.

## Production

Production uses a separate Neon pooled database and `AUTH_PUBLIC_URL` of the deployed site. Set `BETTER_AUTH_SECRET` there. Do not point `.env.development` at Neon.

The page and the API deploy together on Vercel. The long-running `pnpm dev` process runs the reminder `Schedule`. A Vercel function does not keep that fiber alive; run the same `scanOverdue` from a scheduler if you need production reminders.

## Tests

`pnpm test` covers an employee being refused equipment creation, an overlapping loan naming the other person, a touching range being allowed, a missing equipment id, and a single overdue reminder.
