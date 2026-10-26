import { HttpApiGroup } from 'effect/http-api';

import { Authentication } from '../../../auth.ts';
import { borrow, listLoans, returnLoan } from './routes.ts';

/** Loan routes. */
export const LoansGroup = HttpApiGroup.make('loans')
	.add(listLoans)
	.add(borrow)
	.add(returnLoan)
	.middleware(Authentication);
