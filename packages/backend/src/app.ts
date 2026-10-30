import * as Layer from 'effect/Layer';

import { BetterAuthLive } from './auth/index.ts';
import { EquipmentLive, LoansLive, ReminderScheduleLive, RemindersLive } from './features/index.ts';
import { HttpLive } from './http.ts';
import { PersistenceLive } from './sql/index.ts';

/**
 * Use cases and the repositories they need.
 * provideMerge keeps the repositories visible to the overdue scan.
 */
const DomainLive = Layer.mergeAll(EquipmentLive, LoansLive, RemindersLive).pipe(
	Layer.provideMerge(PersistenceLive),
);

/** HTTP API and Better Auth. The reminder fiber is not started. */
export const ApiLive = Layer.mergeAll(HttpLive, BetterAuthLive).pipe(Layer.provide(DomainLive));

/** Domain services for the overdue cron endpoint. HTTP and auth are not started. */
export const CronLive = DomainLive;

/** Long-running server: the API plus the one-minute overdue scan. */
export const ServerLive = Layer.mergeAll(HttpLive, BetterAuthLive, ReminderScheduleLive).pipe(
	Layer.provide(DomainLive),
);
