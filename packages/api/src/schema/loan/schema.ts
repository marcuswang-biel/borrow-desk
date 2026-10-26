import * as Schema from 'effect/Schema';

/** A booking of one piece of equipment for a half-open time range. */
export const Loan = Schema.Struct({
	id: Schema.String,
	equipmentId: Schema.String,
	borrowerId: Schema.String,
	borrowerName: Schema.String,
	startsAt: Schema.Number,
	endsAt: Schema.Number,
	returnedAt: Schema.NullOr(Schema.Number),
});

/** Body used to ask for a new loan. */
export const BorrowLoan = Schema.Struct({
	equipmentId: Schema.String,
	startsAt: Schema.Number,
	endsAt: Schema.Number,
});

/** Loan value returned by the API. */
export type Loan = typeof Loan.Type;
/** Borrow request payload. */
export type BorrowLoan = typeof BorrowLoan.Type;
