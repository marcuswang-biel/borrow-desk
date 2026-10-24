import type { ReminderNotice } from '@borrow-desk/api';
import type * as Effect from 'effect/Effect';

import * as Context from 'effect/Context';

/** Sends an overdue notice once per loan. */
export const Reminder = Context.Service<{
	readonly send: (notice: ReminderNotice) => Effect.Effect<void>;
	readonly list: () => Effect.Effect<ReadonlyArray<ReminderNotice>>;
}>('borrow-desk/Reminder');
