import * as Layer from 'effect/Layer';

import { EquipmentRepoSql, LoanRepoSql, ReminderSql } from '../repo/index.ts';
import { MigratorLive } from './migrate.ts';
import { SqlLive } from './sql.ts';

/**
 * SQL-backed repositories and migrations on one shared pool.
 * provideMerge keeps SqlClient visible to anything built on top of this layer.
 */
export const PersistenceLive = Layer.mergeAll(
	EquipmentRepoSql,
	LoanRepoSql,
	ReminderSql,
	MigratorLive,
).pipe(Layer.provideMerge(SqlLive));
