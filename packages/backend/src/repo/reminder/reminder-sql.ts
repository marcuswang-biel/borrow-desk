import { ReminderNotice } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { SqlClient } from 'effect/sql/SqlClient';
import * as SqlSchema from 'effect/sql/SqlSchema';

import { asDefect } from '../../sql/defect.ts';
import { DbInstant, millis } from '../../sql/instant.ts';
import { Reminder } from './reminder.ts';

/** One reminder row with columns aliased to the domain names. */
const ReminderRow = Schema.Struct({
	loanId: Schema.String,
	userId: Schema.String,
	borrowerName: Schema.String,
	equipmentName: Schema.NullOr(Schema.String),
	equipmentCode: Schema.NullOr(Schema.String),
	sentAt: DbInstant,
});

/** Outbox backed by the reminders table. */
export const ReminderSql = Layer.effect(
	Reminder,
	Effect.gen(function* () {
		const sql = yield* SqlClient;
		const decode = Schema.decodeUnknownEffect(ReminderNotice);
		const read = SqlSchema.findAll({
			Request: Schema.Void,
			Result: ReminderRow,
			execute: () =>
				sql`select loan_id as "loanId", user_id as "userId", borrower_name as "borrowerName", equipment_name as "equipmentName", equipment_code as "equipmentCode", sent_at::float8 as "sentAt" from reminders order by sent_at`,
		});
		const send = Effect.fn('Reminder.send')(function* (notice: ReminderNotice) {
			const message =
				notice.equipmentName === null || notice.equipmentCode === null
					? `${notice.borrowerName} has not returned equipment that is no longer in the catalog`
					: `${notice.borrowerName} has not returned ${notice.equipmentName} ${notice.equipmentCode}`;
			yield* sql`
				insert into reminders (
					loan_id, user_id, message, sent_at, borrower_name, equipment_name, equipment_code
				) values (
					${notice.loanId},
					${notice.userId},
					${message},
					${millis(notice.sentAt)},
					${notice.borrowerName},
					${notice.equipmentName},
					${notice.equipmentCode}
				)
				on conflict (loan_id) do nothing
			`;
		}, asDefect);
		const list = Effect.fn('Reminder.list')(function* () {
			return yield* Effect.forEach(yield* read(), (row) => decode(row));
		}, asDefect);
		return Reminder.of({ send, list });
	}),
);
