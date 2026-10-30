import * as PgMigrator from '@effect/sql-pg/PgMigrator';
import * as Migrator from 'effect/sql/Migrator';

import { migrations } from './migrations/index.ts';

/**
 * Applies the migrations the database has not recorded.
 * The migrations are static imports, so a serverless bundle does not need the filesystem.
 */
/** Migration runner. The caller provides the shared SqlClient. */
export const MigratorLive = PgMigrator.layer({
	loader: Migrator.fromRecord(migrations),
});
