import { CurrentUser, ReminderNotice } from '@borrow-desk/api';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schedule from 'effect/Schedule';

import { EquipmentRepo, Reminder } from '../../repo/index.ts';
import { LoansService } from '../loans/index.ts';
import { noticesFor } from './policy.ts';

/** Notes the signed-in borrower can read. */
export class RemindersService extends Context.Service<
	RemindersService,
	{
		readonly list: () => Effect.Effect<ReadonlyArray<ReminderNotice>, never, CurrentUser>;
	}
>()('borrow-desk/features/reminders/RemindersService') {}

/** Lists reminders addressed to the current user. */
export const RemindersLive = Layer.effect(
	RemindersService,
	Effect.gen(function* () {
		const reminder = yield* Reminder;
		const list = Effect.fn('RemindersService.list')(function* () {
			const user = yield* CurrentUser;
			return noticesFor(user, yield* reminder.list());
		});
		return RemindersService.of({ list });
	}),
);

/** Finds overdue loans and records one reminder for each. */
export const scanOverdue = Effect.fn('scanOverdue')(function* () {
	const loans = yield* LoansService;
	const equipment = yield* EquipmentRepo;
	const reminder = yield* Reminder;
	const now = yield* DateTime.now;
	const overdue = yield* loans.listOverdue(now);
	for (const loan of overdue) {
		const item = yield* equipment.findById(loan.equipmentId);
		yield* reminder.send(
			new ReminderNotice({
				loanId: loan.id,
				userId: loan.borrowerId,
				borrowerName: loan.borrowerName,
				equipmentName: item === undefined ? null : item.name,
				equipmentCode: item === undefined ? null : item.code,
				sentAt: now,
			}),
		);
	}
});

/**
 * Runs the overdue scan on a one-minute schedule inside the long-running server.
 * A failure is logged and the schedule continues. The fiber stops when the server scope closes.
 * A serverless request does not start this fiber.
 */
export const ReminderScheduleLive = Layer.effectDiscard(
	scanOverdue().pipe(
		Effect.catchCause((cause) => Effect.logError(Cause.pretty(cause))),
		Effect.repeat(Schedule.spaced('1 minute')),
		Effect.forkScoped,
	),
);
