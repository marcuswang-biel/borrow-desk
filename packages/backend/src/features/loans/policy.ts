import { Forbidden, type Loan, type User } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';

/** Allows a return when the caller owns the loan or is an admin. */
export const requireBorrowerOrAdmin = (user: User, loan: Loan) =>
	user.role === 'admin' || user.id === loan.borrowerId
		? Effect.void
		: Effect.fail(new Forbidden({ message: 'You can only return your own loan' }));
