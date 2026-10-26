import { Layer } from 'effect';

import { EquipmentRepoSql, LoanRepoSql, ReminderSql } from '../repo/index.ts';
import { MigratorLive } from './migrate.ts';

/** SQL-backed repositories, the reminder outbox, and migrations. */
export const PersistenceLive = Layer.mergeAll(
	EquipmentRepoSql,
	LoanRepoSql,
	ReminderSql,
	MigratorLive,
);
