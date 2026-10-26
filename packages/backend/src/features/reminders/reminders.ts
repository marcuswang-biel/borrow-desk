import { CurrentUser, type ReminderNotice } from '@borrow-desk/api';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schedule from 'effect/Schedule';

import { EquipmentRepo, Reminder } from '../../repo/index.ts';
import { LoansService } from '../loans/index.ts';
import { noticesFor } from './policy.ts';

/** Sentence stored for one overdue loan. Names the kind and its number. */
export const reminderMessage = (
	borrowerName: string,
	equipmentName: string,
	code: string,
): string => `${borrowerName} has not returned ${equipmentName} ${code}`;

/** Notes the signed-in borrower can read. */
export const RemindersService = Context.Service<{
	readonly list: () => Effect.Effect<ReadonlyArray<ReminderNotice>, never, CurrentUser>;
}>('borrow-desk/RemindersService');

/** Lists reminders addressed to the current user. */
export const RemindersLive = Layer.effect(
	RemindersService,
	Effect.gen(function* () {
		const reminder = yield* Reminder;
		return {
			list: () =>
				Effect.gen(function* () {
					const user = yield* CurrentUser;
					return noticesFor(user, yield* reminder.list());
				}),
		};
	}),
);

/** Finds overdue loans and records one reminder for each. */
export const scanOverdue = Effect.gen(function* () {
	const loans = yield* LoansService;
	const equipment = yield* EquipmentRepo;
	const reminder = yield* Reminder;
	const now = yield* Clock.currentTimeMillis;
	const overdue = yield* loans.listOverdue(now);
	for (const loan of overdue) {
		const item = yield* equipment.findById(loan.equipmentId);
		const message =
			item === undefined
				? `${loan.borrowerName} has not returned equipment that is no longer in the catalog`
				: reminderMessage(loan.borrowerName, item.name, item.code);
		yield* reminder.send({
			loanId: loan.id,
			userId: loan.borrowerId,
			message,
			sentAt: now,
		});
	}
});

/**
 * Runs the overdue scan on a one-minute schedule.
 * This fiber lives in the long-running Node process, not in a serverless request.
 */
export const ReminderScheduleLive = Layer.effectDiscard(
	scanOverdue.pipe(Effect.repeat(Schedule.spaced('1 minute')), Effect.forkDetach),
);
