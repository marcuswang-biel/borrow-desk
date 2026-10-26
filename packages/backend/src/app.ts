import * as Layer from 'effect/Layer';

import { BetterAuthLive } from './auth/index.ts';
import { EquipmentLive, LoansLive, ReminderScheduleLive, RemindersLive } from './features/index.ts';
import { HttpLive } from './http.ts';
import { PersistenceLive, SqlLive } from './sql/index.ts';

/**
 * Use cases plus the services they need.
 * mergeAll does not feed one sibling into another, so the repositories are provided explicitly.
 */
const DomainLive = Layer.mergeAll(
	Layer.mergeAll(EquipmentLive, LoansLive, RemindersLive).pipe(Layer.provide(PersistenceLive)),
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
