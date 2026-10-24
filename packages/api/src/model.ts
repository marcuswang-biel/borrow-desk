import * as Schema from 'effect/Schema';

/** Role stored for a signed-in person. */
export const Role = Schema.Literals(['admin', 'employee']);

/** Person resolved from the bearer token. */
export const User = Schema.Struct({
	id: Schema.String,
	email: Schema.String,
	name: Schema.String,
	role: Role,
});

/** One piece of equipment an admin has recorded. `code` is its number within `name`. */
export const Equipment = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	code: Schema.String,
	createdAt: Schema.Number,
});

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

/** Body used to record a new piece of equipment. */
export const CreateEquipment = Schema.Struct({
	name: Schema.String,
	code: Schema.String,
});

/** A reminder already delivered for one overdue loan. */
export const ReminderNotice = Schema.Struct({
	loanId: Schema.String,
	userId: Schema.String,
	message: Schema.String,
	sentAt: Schema.Number,
});

/** User value shared by the API and the server. */
export type User = typeof User.Type;
/** Role value carried on the current user. */
export type Role = typeof Role.Type;
/** Equipment value returned by the API. */
export type Equipment = typeof Equipment.Type;
/** Loan value returned by the API. */
export type Loan = typeof Loan.Type;
/** Borrow request payload. */
export type BorrowLoan = typeof BorrowLoan.Type;
/** Create-equipment payload. */
export type CreateEquipment = typeof CreateEquipment.Type;
/** Reminder value stored by the reminder service. */
export type ReminderNotice = typeof ReminderNotice.Type;

/** Caller is signed out or the token cannot be trusted. */
export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
	'Unauthorized',
	{ message: Schema.String },
	{ httpApiStatus: 401 },
) {}

/** Caller is signed in but the action is not allowed for their role. */
export class Forbidden extends Schema.TaggedError<Forbidden>()(
	'Forbidden',
	{ message: Schema.String },
	{ httpApiStatus: 403 },
) {}

/** This name already has a piece with this number. */
export class EquipmentCodeTaken extends Schema.TaggedError<EquipmentCodeTaken>()(
	'EquipmentCodeTaken',
	{ message: Schema.String },
	{ httpApiStatus: 409 },
) {}

/** The requested equipment id is not in the catalog. */
export class EquipmentNotFound extends Schema.TaggedError<EquipmentNotFound>()(
	'EquipmentNotFound',
	{ message: Schema.String },
	{ httpApiStatus: 404 },
) {}

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

/**
 * Two half-open ranges overlap when each starts before the other ends.
 * Touching at an endpoint does not overlap.
 */
export const rangesOverlap = (
	leftStart: number,
	leftEnd: number,
	rightStart: number,
	rightEnd: number,
): boolean => leftStart < rightEnd && rightStart < leftEnd;
