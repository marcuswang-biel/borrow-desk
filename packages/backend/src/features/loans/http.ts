import { Api } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder';

import { LoansService } from './loans.ts';

/** HTTP adapters for borrowing and returning. */
export const LoansHttpLive = HttpApiBuilder.group(Api, 'loans', (handlers) =>
	Effect.gen(function* () {
		const loans = yield* LoansService;
		return handlers
			.handle('listLoans', () => loans.list())
			.handle('borrow', ({ payload }) => loans.borrow(payload))
			.handle('returnLoan', ({ params }) => loans.returnLoan(params.id));
	}),
);
