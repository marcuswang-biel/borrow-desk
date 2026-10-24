import type { Loan } from '@borrow-desk/api';
import type * as Effect from 'effect/Effect';

import * as Context from 'effect/Context';

/** Persistence port for loans. */
export const LoanRepo = Context.Service<{
	readonly insert: (loan: Loan) => Effect.Effect<void>;
	readonly list: () => Effect.Effect<ReadonlyArray<Loan>>;
	readonly findById: (id: string) => Effect.Effect<Loan | undefined>;
	readonly findOverlap: (
		equipmentId: string,
		startsAt: number,
		endsAt: number,
	) => Effect.Effect<Loan | undefined>;
	readonly markReturned: (id: string, returnedAt: number) => Effect.Effect<void>;
	readonly listOverdue: (now: number) => Effect.Effect<ReadonlyArray<Loan>>;
}>('borrow-desk/LoanRepo');
