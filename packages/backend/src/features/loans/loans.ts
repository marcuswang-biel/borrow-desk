import {
	CurrentUser,
	EquipmentNotFound,
	Forbidden,
	InvalidLoanPeriod,
	type Loan,
	LoanConflict,
	LoanNotFound,
} from '@borrow-desk/api';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EquipmentRepo, LoanRepo } from '../../repo/index.ts';
import { requireBorrowerOrAdmin } from './policy.ts';

/** Input for a new loan. Times are epoch milliseconds. */
export interface BorrowInput {
	readonly equipmentId: string;
	readonly startsAt: number;
	readonly endsAt: number;
}

/** Use cases for borrowing and returning equipment. */
export const LoansService = Context.Service<{
	readonly list: () => Effect.Effect<ReadonlyArray<Loan>>;
	readonly borrow: (
		input: BorrowInput,
	) => Effect.Effect<Loan, EquipmentNotFound | InvalidLoanPeriod | LoanConflict, CurrentUser>;
	readonly returnLoan: (id: string) => Effect.Effect<Loan, LoanNotFound | Forbidden, CurrentUser>;
	readonly listOverdue: (now: number) => Effect.Effect<ReadonlyArray<Loan>>;
}>('borrow-desk/LoansService');

/** Loan use cases over the provided equipment and loan repositories. */
export const LoansLive = Layer.effect(
	LoansService,
	Effect.gen(function* () {
		const loans = yield* LoanRepo;
		const equipment = yield* EquipmentRepo;
		return {
			list: () => loans.list(),
			listOverdue: (now) => loans.listOverdue(now),
			borrow: (input) =>
				Effect.gen(function* () {
					const user = yield* CurrentUser;
					if (input.endsAt <= input.startsAt) {
						return yield* new InvalidLoanPeriod({ message: 'The end must be after the start' });
					}
					const item = yield* equipment.findById(input.equipmentId);
					if (item === undefined) {
						return yield* new EquipmentNotFound({ message: 'That equipment does not exist' });
					}
					const clash = yield* loans.findOverlap(input.equipmentId, input.startsAt, input.endsAt);
					if (clash !== undefined) {
						return yield* new LoanConflict({
							message: `That time overlaps ${clash.borrowerName}`,
							borrowerName: clash.borrowerName,
							startsAt: clash.startsAt,
							endsAt: clash.endsAt,
						});
					}
					const loan: Loan = {
						id: crypto.randomUUID(),
						equipmentId: input.equipmentId,
						borrowerId: user.id,
						borrowerName: user.name,
						startsAt: input.startsAt,
						endsAt: input.endsAt,
						returnedAt: null,
					};
					yield* loans.insert(loan);
					return loan;
				}),
			returnLoan: (id) =>
				Effect.gen(function* () {
					const user = yield* CurrentUser;
					const loan = yield* loans.findById(id);
					if (loan === undefined) {
						return yield* new LoanNotFound({ message: 'That loan does not exist' });
					}
					yield* requireBorrowerOrAdmin(user, loan);
					const returnedAt = yield* Clock.currentTimeMillis;
					yield* loans.markReturned(id, returnedAt);
					return { ...loan, returnedAt };
				}),
		};
	}),
);
