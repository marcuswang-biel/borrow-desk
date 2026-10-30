import * as Schema from 'effect/Schema';

import { Instant } from '../instant.ts';

/** A reminder already delivered for one overdue loan. */
export class ReminderNotice extends Schema.Class<ReminderNotice>('ReminderNotice')({
	loanId: Schema.String,
	userId: Schema.String,
	borrowerName: Schema.String,
	equipmentName: Schema.NullOr(Schema.String),
	equipmentCode: Schema.NullOr(Schema.String),
	sentAt: Instant,
}) {}
