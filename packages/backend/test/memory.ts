import type { Equipment, ReminderNotice } from '@borrow-desk/api';

import { type Loan, rangesOverlap } from '@borrow-desk/api';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { EquipmentRepo, LoanRepo, Reminder } from '../src/repo/index.ts';

/** In-memory catalog used by tests. */
export const EquipmentRepoMemory = Layer.effect(
	EquipmentRepo,
	Effect.gen(function* () {
		const rows = yield* Ref.make<ReadonlyArray<Equipment>>([]);
		return {
			insert: (item) => Ref.update(rows, (current) => [...current, item]),
			list: () => Ref.get(rows),
			findById: (id) =>
				Ref.get(rows).pipe(Effect.map((current) => current.find((item) => item.id === id))),
			findByNameAndCode: (name, code) =>
				Ref.get(rows).pipe(
					Effect.map((current) => current.find((item) => item.name === name && item.code === code)),
				),
		};
	}),
);

/** A loan is still out when it has not been returned. */
const isOpen = (loan: Loan) => loan.returnedAt === null;

/** In-memory ledger used by tests. */
export const LoanRepoMemory = Layer.effect(
	LoanRepo,
	Effect.gen(function* () {
		const rows = yield* Ref.make<ReadonlyArray<Loan>>([]);
		return {
			insert: (loan) => Ref.update(rows, (current) => [...current, loan]),
			list: () => Ref.get(rows),
			findById: (id) =>
				Ref.get(rows).pipe(Effect.map((current) => current.find((loan) => loan.id === id))),
			findOverlap: (equipmentId, startsAt, endsAt) =>
				Ref.get(rows).pipe(
					Effect.map((current) =>
						current.find(
							(loan) =>
								loan.equipmentId === equipmentId &&
								isOpen(loan) &&
								rangesOverlap(loan.startsAt, loan.endsAt, startsAt, endsAt),
						),
					),
				),
			markReturned: (id, returnedAt) =>
				Ref.update(rows, (current) =>
					current.map((loan) => (loan.id === id ? { ...loan, returnedAt } : loan)),
				),
			listOverdue: (now) =>
				Ref.get(rows).pipe(
					Effect.map((current) => current.filter((loan) => isOpen(loan) && loan.endsAt < now)),
				),
		};
	}),
);

/** In-memory outbox used by tests. */
export const ReminderMemory = Layer.effect(
	Reminder,
	Effect.gen(function* () {
		const sent = yield* Ref.make<ReadonlyArray<ReminderNotice>>([]);
		return {
			send: (notice) =>
				Ref.update(sent, (current) =>
					current.some((item) => item.loanId === notice.loanId) ? current : [...current, notice],
				),
			list: () => Ref.get(sent),
		};
	}),
);
