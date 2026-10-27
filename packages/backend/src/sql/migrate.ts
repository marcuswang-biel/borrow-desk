import * as PgMigrator from '@effect/sql-pg/PgMigrator';
import * as Layer from 'effect/Layer';
import * as Migrator from 'effect/sql/Migrator';

import { migrations } from './migrations/index.ts';
import { SqlLive } from './sql.ts';

/**
 * Applies the migrations the database has not recorded.
 * The migrations are static imports, so a serverless bundle does not need the filesystem.
 */
export const MigratorLive = PgMigrator.layer({
	loader: Migrator.fromRecord(migrations),
}).pipe(Layer.provide(SqlLive));
