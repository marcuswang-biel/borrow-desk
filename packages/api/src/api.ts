import * as HttpApi from 'effect/http-api/HttpApi';
import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup';
import * as Schema from 'effect/Schema';

import { Authentication } from './auth.ts';
import {
	BorrowLoan,
	CreateEquipment,
	Equipment,
	EquipmentCodeTaken,
	EquipmentNotFound,
	Forbidden,
	InvalidLoanPeriod,
	Loan,
	LoanConflict,
	LoanNotFound,
	User,
} from './model.ts';

/** Health payload. A successful response means PostgreSQL answered. */
const Health = Schema.Struct({
	status: Schema.Literal('ok'),
});

/** Unauthenticated database probe. */
const getHealth = HttpApiEndpoint.get('getHealth', '/api/health', {
	success: Health,
});

/** Signed-in caller's identity. */
const getMe = HttpApiEndpoint.get('getMe', '/api/me', {
	success: User,
});

/** Catalog of equipment. */
const listEquipment = HttpApiEndpoint.get('listEquipment', '/api/equipment', {
	success: Schema.Array(Equipment),
});

/** Admin records one piece of equipment. */
const createEquipment = HttpApiEndpoint.post('createEquipment', '/api/equipment', {
	payload: CreateEquipment,
	success: Equipment,
	error: [Forbidden, EquipmentCodeTaken],
});

/** Loans currently stored. */
const listLoans = HttpApiEndpoint.get('listLoans', '/api/loans', {
	success: Schema.Array(Loan),
});

/** Employee or admin asks to borrow one piece of equipment. */
const borrow = HttpApiEndpoint.post('borrow', '/api/loans', {
	payload: BorrowLoan,
	success: Loan,
	error: [EquipmentNotFound, InvalidLoanPeriod, LoanConflict],
});

/** Borrower or admin marks a loan returned. */
const returnLoan = HttpApiEndpoint.post('returnLoan', '/api/loans/:id/return', {
	params: Schema.Struct({ id: Schema.String }),
	success: Loan,
	error: [LoanNotFound, Forbidden],
});

/** Open health route. */
export const HealthGroup = HttpApiGroup.make('health').add(getHealth);

/** Routes that only need a signed-in person. */
export const SessionGroup = HttpApiGroup.make('session').add(getMe).middleware(Authentication);

/** Equipment catalog routes. */
export const EquipmentGroup = HttpApiGroup.make('equipment')
	.add(listEquipment)
	.add(createEquipment)
	.middleware(Authentication);

/** Loan routes. */
export const LoansGroup = HttpApiGroup.make('loans')
	.add(listLoans)
	.add(borrow)
	.add(returnLoan)
	.middleware(Authentication);

/** Shared HTTP contract. The browser client is generated from this value. */
export const Api = HttpApi.make('borrow-desk')
	.add(HealthGroup)
	.add(SessionGroup)
	.add(EquipmentGroup)
	.add(LoansGroup);
