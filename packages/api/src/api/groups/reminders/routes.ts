import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as Schema from 'effect/Schema';

import { ReminderNotice } from '../../../schema/reminder/index.ts';

/** Notes already sent to the signed-in borrower. */
export const listReminders = HttpApiEndpoint.get('listReminders', '/api/reminders', {
	success: Schema.Array(ReminderNotice),
});
