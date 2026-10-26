import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { SqlClient } from 'effect/sql/SqlClient';

import { Reminder } from './reminder.ts';

/** One reminder row as PostgreSQL returns it. */
interface ReminderRow {
	readonly loan_id: string;
	readonly user_id: string;
	readonly message: string;
	readonly sent_at: string | number;
}

/** Outbox backed by the reminders table. */
export const ReminderSql = Layer.effect(
	Reminder,
	Effect.gen(function* () {
		const sql = yield* SqlClient;
		return {
			send: (notice) =>
				sql`
					insert into reminders (loan_id, user_id, message, sent_at)
					values (${notice.loanId}, ${notice.userId}, ${notice.message}, ${notice.sentAt})
					on conflict (loan_id) do nothing
				`.pipe(Effect.asVoid, Effect.orDie),
			list: () =>
				sql<ReminderRow>`select loan_id, user_id, message, sent_at from reminders order by sent_at`.pipe(
					Effect.map((rows) =>
						rows.map((row) => ({
							loanId: row.loan_id,
							userId: row.user_id,
							message: row.message,
							sentAt: Number(row.sent_at),
						})),
					),
					Effect.orDie,
				),
		};
	}),
);
