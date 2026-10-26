import * as PgMigrator from '@effect/sql-pg/PgMigrator';
import * as Layer from 'effect/Layer';
import * as Migrator from 'effect/sql/Migrator';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SqlLive } from './sql.ts';

/** Migration files beside this module, used when Node runs the TypeScript source. */
const besideModule = fileURLToPath(new URL('./migrations', import.meta.url));

/** Same folder copied into a Vercel function, where the bundle no longer sits next to the source. */
const inDeployment = join(process.cwd(), 'packages/backend/src/sql/migrations');

/**
 * Directory of `<YYYYMMDDNN>_<name>.ts` files.
 * `NN` is the same-day sequence. The loader uses the digits as the migration id, so each file needs its own number.
 */
export const migrationsDirectory = existsSync(besideModule) ? besideModule : inDeployment;

/** Loads every migration file in order and applies the ones the database has not recorded. */
export const MigratorLive = PgMigrator.layer({
	loader: Migrator.fromFileSystem(migrationsDirectory),
}).pipe(Layer.provide(SqlLive));
