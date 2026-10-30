import { Loan, type Equipment, type ReminderNotice } from '@borrow-desk/api';
import { rangesOverlap } from '@borrow-desk/api';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { EquipmentRepo, LoanRepo, Reminder } from '../src/repo/index.ts';

/** In-memory catalog used by tests. */
export const EquipmentRepoMemory = Layer.effect(
	EquipmentRepo,
	Effect.gen(function* () {
		const rows = yield* Ref.make<ReadonlyArray<Equipment>>([]);
		return EquipmentRepo.of({
			insertIfNew: (item) =>
				Ref.modify(rows, (current) => {
					const existing = current.find(
						(entry) => entry.name === item.name && entry.code === item.code,
					);
					if (existing !== undefined) {
						return [existing, current] as const;
					}
					return [undefined, [...current, item]] as const;
				}),
			list: () => Ref.get(rows),
			findById: (id) =>
				Ref.get(rows).pipe(Effect.map((current) => current.find((item) => item.id === id))),
		});
	}),
);

/** A loan is still out when it has not been returned. */
const isOpen = (loan: Loan) => loan.returnedAt === null;

/** In-memory ledger used by tests. The check and insert share one update. */
export const LoanRepoMemory = Layer.effect(
	LoanRepo,
	Effect.gen(function* () {
		const rows = yield* Ref.make<ReadonlyArray<Loan>>([]);
		return LoanRepo.of({
			list: () => Ref.get(rows),
			findById: (id) =>
				Ref.get(rows).pipe(Effect.map((current) => current.find((loan) => loan.id === id))),
			insertIfFree: (loan) =>
				Ref.modify(rows, (current) => {
					const clash = current.find(
						(entry) =>
							entry.equipmentId === loan.equipmentId &&
							isOpen(entry) &&
							rangesOverlap(entry.startsAt, entry.endsAt, loan.startsAt, loan.endsAt),
					);
					if (clash !== undefined) {
						return [clash, current] as const;
					}
					return [undefined, [...current, loan]] as const;
				}),
			markReturned: (id: string, returnedAt: DateTime.Utc) =>
				Ref.update(rows, (current) =>
					current.map((loan) => (loan.id === id ? new Loan({ ...loan, returnedAt }) : loan)),
				),
			listOverdue: (now: DateTime.Utc) =>
				Ref.get(rows).pipe(
					Effect.map((current) =>
						current.filter(
							(loan) =>
								isOpen(loan) && DateTime.toEpochMillis(loan.endsAt) < DateTime.toEpochMillis(now),
						),
					),
				),
		});
	}),
);

/** In-memory outbox used by tests. */
export const ReminderMemory = Layer.effect(
	Reminder,
	Effect.gen(function* () {
		const sent = yield* Ref.make<ReadonlyArray<ReminderNotice>>([]);
		return Reminder.of({
			send: (notice) =>
				Ref.update(sent, (current) =>
					current.some((item) => item.loanId === notice.loanId) ? current : [...current, notice],
				),
			list: () => Ref.get(sent),
		});
	}),
);
