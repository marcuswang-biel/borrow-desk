import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schedule from 'effect/Schedule';

import { Reminder } from '../../repo/index.ts';
import { LoansService } from '../loans/index.ts';

/** Finds overdue loans and records one reminder for each. */
export const scanOverdue = Effect.gen(function* () {
	const loans = yield* LoansService;
	const reminder = yield* Reminder;
	const now = yield* Clock.currentTimeMillis;
	const overdue = yield* loans.listOverdue(now);
	for (const loan of overdue) {
		yield* reminder.send({
			loanId: loan.id,
			userId: loan.borrowerId,
			message: `${loan.borrowerName} has not returned equipment ${loan.equipmentId}`,
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
