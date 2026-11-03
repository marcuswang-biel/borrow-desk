import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as Schema from 'effect/Schema';

import { ReminderNotice, ReminderNotFound } from '../../../schema/reminder/index.ts';

/** Notes already sent to the signed-in borrower. */
export const listReminders = HttpApiEndpoint.get('listReminders', '/api/reminders', {
	success: Schema.Array(ReminderNotice),
});

/** The signed-in borrower marks one of their reminders read. */
export const readReminder = HttpApiEndpoint.post('readReminder', '/api/reminders/:loanId/read', {
	params: Schema.Struct({ loanId: Schema.String }),
	success: ReminderNotice,
	error: [ReminderNotFound],
});
