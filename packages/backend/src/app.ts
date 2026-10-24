import { Api } from '@borrow-desk/api';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';
import * as Layer from 'effect/Layer';

import { AuthenticationLive, BetterAuthLive } from './auth/index.ts';
import {
	EquipmentHttpLive,
	EquipmentLive,
	HealthLive,
	LoansHttpLive,
	LoansLive,
	ReminderScheduleLive,
	SessionLive,
} from './features/index.ts';
import { EquipmentRepoSql, LoanRepoSql, ReminderSql } from './repo/index.ts';
import { MigratorLive, SqlLive } from './sql/index.ts';

/** Route handlers. Domain services are provided once, beside this layer. */
const HttpLive = HttpApiBuilder.layer(Api).pipe(
	Layer.provide(HealthLive),
	Layer.provide(SessionLive),
	Layer.provide(EquipmentHttpLive),
	Layer.provide(LoansHttpLive),
	Layer.provide(AuthenticationLive),
);

/** SQL-backed repositories, the reminder outbox, and migrations. */
const PersistenceLive = Layer.mergeAll(EquipmentRepoSql, LoanRepoSql, ReminderSql, MigratorLive);

/**
 * Use cases plus the services they need.
 * mergeAll does not feed one sibling into another, so the repositories are provided explicitly.
 */
const DomainLive = Layer.mergeAll(
	Layer.mergeAll(EquipmentLive, LoansLive).pipe(Layer.provide(PersistenceLive)),
	PersistenceLive,
);

/** HTTP API and Better Auth. The reminder fiber is not started. */
export const ApiLive = Layer.mergeAll(HttpLive, BetterAuthLive).pipe(
	Layer.provide(DomainLive),
	Layer.provide(SqlLive),
);

/** Long-running server: the API plus the one-minute overdue scan. */
export const ServerLive = Layer.mergeAll(HttpLive, BetterAuthLive, ReminderScheduleLive).pipe(
	Layer.provide(DomainLive),
	Layer.provide(SqlLive),
);
