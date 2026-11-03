import type { ReminderNotice } from '@borrow-desk/api';
import type * as DateTime from 'effect/DateTime';
import type * as Effect from 'effect/Effect';

import * as Context from 'effect/Context';

/** Sends an overdue notice once per loan, and records when its borrower reads it. */
export class Reminder extends Context.Service<
	Reminder,
	{
		readonly send: (notice: ReminderNotice) => Effect.Effect<void>;
		readonly list: () => Effect.Effect<ReadonlyArray<ReminderNotice>>;
		readonly markRead: (
			loanId: string,
			userId: string,
			readAt: DateTime.Utc,
		) => Effect.Effect<ReminderNotice | undefined>;
	}
>()('borrow-desk/repo/reminder/Reminder') {}
