import {
	BorrowLoan,
	CurrentUser,
	EquipmentNotFound,
	Forbidden,
	InvalidLoanPeriod,
	Loan,
	LoanConflict,
	LoanNotFound,
} from '@borrow-desk/api';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EquipmentRepo, LoanRepo } from '../../repo/index.ts';
import { requireBorrowerOrAdmin } from './policy.ts';

/** Use cases for borrowing and returning equipment. */
export class LoansService extends Context.Service<
	LoansService,
	{
		readonly list: () => Effect.Effect<ReadonlyArray<Loan>>;
		readonly borrow: (
			input: BorrowLoan,
		) => Effect.Effect<Loan, EquipmentNotFound | InvalidLoanPeriod | LoanConflict, CurrentUser>;
		readonly returnLoan: (id: string) => Effect.Effect<Loan, LoanNotFound | Forbidden, CurrentUser>;
		readonly listOverdue: (now: DateTime.Utc) => Effect.Effect<ReadonlyArray<Loan>>;
	}
>()('borrow-desk/features/loans/LoansService') {}

/** Loan use cases over the provided equipment and loan repositories. */
export const LoansLive = Layer.effect(
	LoansService,
	Effect.gen(function* () {
		const loans = yield* LoanRepo;
		const equipment = yield* EquipmentRepo;
		const list = loans.list;
		const listOverdue = loans.listOverdue;
		const borrow = Effect.fn('LoansService.borrow')(function* (input: BorrowLoan) {
			const user = yield* CurrentUser;
			if (DateTime.toEpochMillis(input.endsAt) <= DateTime.toEpochMillis(input.startsAt)) {
				return yield* new InvalidLoanPeriod({ message: 'The end must be after the start' });
			}
			const item = yield* equipment.findById(input.equipmentId);
			if (item === undefined) {
				return yield* new EquipmentNotFound({ message: 'That equipment does not exist' });
			}
			const loan = new Loan({
				id: globalThis.crypto.randomUUID(),
				equipmentId: input.equipmentId,
				borrowerId: user.id,
				borrowerName: user.name,
				startsAt: input.startsAt,
				endsAt: input.endsAt,
				returnedAt: null,
			});
			const clash = yield* loans.insertIfFree(loan);
			if (clash !== undefined) {
				return yield* new LoanConflict({
					message: `That time overlaps ${clash.borrowerName}`,
					borrowerName: clash.borrowerName,
					startsAt: clash.startsAt,
					endsAt: clash.endsAt,
				});
			}
			return loan;
		});
		const returnLoan = Effect.fn('LoansService.returnLoan')(function* (id: string) {
			const user = yield* CurrentUser;
			const loan = yield* loans.findById(id);
			if (loan === undefined) {
				return yield* new LoanNotFound({ message: 'That loan does not exist' });
			}
			yield* requireBorrowerOrAdmin(user, loan);
			const returnedAt = yield* DateTime.now;
			yield* loans.markReturned(id, returnedAt);
			return new Loan({ ...loan, returnedAt });
		});
		return LoansService.of({ list, borrow, returnLoan, listOverdue });
	}),
);
