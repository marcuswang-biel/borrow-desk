import * as Schema from 'effect/Schema';

import { Instant } from '../instant.ts';

/** A booking of one piece of equipment for a half-open time range. */
export class Loan extends Schema.Class<Loan>('Loan')({
	id: Schema.String,
	equipmentId: Schema.String,
	borrowerId: Schema.String,
	borrowerName: Schema.String,
	startsAt: Instant,
	endsAt: Instant,
	returnedAt: Schema.NullOr(Instant),
}) {}

/** Body used to ask for a new loan. */
export class BorrowLoan extends Schema.Class<BorrowLoan>('BorrowLoan')({
	equipmentId: Schema.String,
	startsAt: Instant,
	endsAt: Instant,
}) {}
