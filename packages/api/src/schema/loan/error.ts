import * as Schema from 'effect/Schema';

/** The requested loan id is not in the ledger. */
export class LoanNotFound extends Schema.TaggedError<LoanNotFound>()(
	'LoanNotFound',
	{ message: Schema.String },
	{ httpApiStatus: 404 },
) {}

/** The requested range ends at or before it starts. */
export class InvalidLoanPeriod extends Schema.TaggedError<InvalidLoanPeriod>()(
	'InvalidLoanPeriod',
	{ message: Schema.String },
	{ httpApiStatus: 400 },
) {}

/** The requested range overlaps a loan that is still out. */
export class LoanConflict extends Schema.TaggedError<LoanConflict>()(
	'LoanConflict',
	{
		message: Schema.String,
		borrowerName: Schema.String,
		startsAt: Schema.Number,
		endsAt: Schema.Number,
	},
	{ httpApiStatus: 409 },
) {}

/** Failures from borrowing or returning one loan. */
export type LoanError = LoanNotFound | InvalidLoanPeriod | LoanConflict;
