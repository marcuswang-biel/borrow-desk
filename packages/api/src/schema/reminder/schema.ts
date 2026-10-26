import * as Schema from 'effect/Schema';

/** A reminder already delivered for one overdue loan. */
export const ReminderNotice = Schema.Struct({
	loanId: Schema.String,
	userId: Schema.String,
	message: Schema.String,
	sentAt: Schema.Number,
});

/** Reminder value stored by the reminder service. */
export type ReminderNotice = typeof ReminderNotice.Type;
