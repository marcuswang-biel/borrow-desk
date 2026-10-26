# Release the pushed main commit

`origin/main` at `81c6d29` is the latest pushed commit. Production was still the older `rebuild` deployment `40f7b0be`. The project’s Git link is empty, so another push does not start a build.

## Where the app is built

Uploading the working tree with `vercel --prod` would ship the uncommitted `.gitignore` and would not name the Git commit. A GitHub Actions prebuilt pipeline is the right shape when a test gate has to run before release. This repository has no such pipeline, and the commit is already on GitHub.

The release is a local production build of that Git tree, uploaded with `vercel deploy --prebuilt --prod`. A remote build of the same tree left the migration directory out of the function. The local build places `packages/backend/src/sql/migrations` and `packages/api` in the function output.

`functions.*.includeFiles` now has to be one glob string. The committed array is rejected before the build starts. A brace glob kept the API package and dropped the migrations. A migrations-only glob dropped the API package. The build includes `packages/**` and excludes `packages/frontend/**`. The project build settings match `vercel.json`: `pnpm install`, `pnpm --filter @borrow-desk/frontend build`, and `packages/frontend/dist`. The dashboard still had the template values `npm run build` and `apps/web/dist`.

## Database

The commit adds no migration file. Neon production is the default branch `main` (`br-calm-shape-a175edu1`). `effect_sql_migrations` already records `2026102401` equipment, `2026102402` loans, and `2026102403` reminders, and those tables match the files.

Running the migrator again on the first function request would use the pooled URL. Neon wants a direct connection for schema changes, and there is nothing new to apply. Hand-written SQL would skip the migration ledger. A branch rehearsal is for a change that has not been applied yet. This release leaves the production branch as it is.
