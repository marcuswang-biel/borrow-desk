import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as Schema from 'effect/Schema';

import { EquipmentNotFound } from '../../../schema/equipment/index.ts';
import {
	BorrowLoan,
	InvalidLoanPeriod,
	Loan,
	LoanConflict,
	LoanNotFound,
} from '../../../schema/loan/index.ts';
import { Forbidden } from '../../../schema/user/index.ts';

/** Loans currently stored. */
export const listLoans = HttpApiEndpoint.get('listLoans', '/api/loans', {
	success: Schema.Array(Loan),
});

/** Employee or admin asks to borrow one piece of equipment. */
export const borrow = HttpApiEndpoint.post('borrow', '/api/loans', {
	payload: BorrowLoan,
	success: Loan,
	error: [EquipmentNotFound, InvalidLoanPeriod, LoanConflict],
});

/** Borrower or admin marks a loan returned. */
export const returnLoan = HttpApiEndpoint.post('returnLoan', '/api/loans/:id/return', {
	params: Schema.Struct({ id: Schema.String }),
	success: Loan,
	error: [LoanNotFound, Forbidden],
});
