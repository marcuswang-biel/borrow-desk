import type { Loan } from '@borrow-desk/api';
import type * as DateTime from 'effect/DateTime';
import type * as Effect from 'effect/Effect';

import * as Context from 'effect/Context';

/** Persistence port for loans. */
export class LoanRepo extends Context.Service<
	LoanRepo,
	{
		readonly list: () => Effect.Effect<ReadonlyArray<Loan>>;
		readonly findById: (id: string) => Effect.Effect<Loan | undefined>;
		readonly insertIfFree: (loan: Loan) => Effect.Effect<Loan | undefined>;
		readonly markReturned: (id: string, returnedAt: DateTime.Utc) => Effect.Effect<void>;
		readonly listOverdue: (now: DateTime.Utc) => Effect.Effect<ReadonlyArray<Loan>>;
	}
>()('borrow-desk/repo/loans/LoanRepo') {}
