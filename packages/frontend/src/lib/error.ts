import type { EquipmentError, LoanError, ReminderNotice, UserError } from '@borrow-desk/api';
import type * as HttpClientError from 'effect/http/HttpClientError';
import type * as Schema from 'effect/Schema';

import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';

import { m } from '../paraglide/messages.js';
import { formatWhen } from './text.ts';

/** Failures the page can show: the shared contract, or the transport around it. */
export type DeskError =
	| EquipmentError
	| LoanError
	| UserError
	| HttpClientError.HttpClientError
	| Schema.SchemaError;

/** Turns one reminder into the active language. */
export const shownReminder = (notice: ReminderNotice) =>
	notice.equipmentName === null || notice.equipmentCode === null
		? m.reminderMissing({ name: notice.borrowerName })
		: m.reminderBody({
				name: notice.borrowerName,
				equipment: notice.equipmentName,
				code: notice.equipmentCode,
			});

/** Sentence for one shared failure, in the active language. */
const forbiddenCopy = (message: string) => {
	switch (message) {
		case 'You can only return your own loan':
			return m.returnOwnLoan();
		case 'Only an admin can record equipment':
			return m.adminOnly();
		default:
			return message;
	}
};

/** Name and number from the stored equipment-code sentence. */
const takenCopy = (message: string) => {
	const marker = ' already has number ';
	const index = message.lastIndexOf(marker);
	if (index < 0) {
		return message;
	}
	return m.equipmentCodeTaken({
		name: message.slice(0, index),
		code: message.slice(index + marker.length),
	});
};

/** Sentence for one shared failure. Transport and decode failures use the active language. */
export const shown = (error: DeskError) =>
	Match.value(error).pipe(
		Match.tag('EquipmentCodeTaken', (failure) => takenCopy(failure.message)),
		Match.tag('EquipmentNotFound', () => m.equipmentMissing()),
		Match.tag('Forbidden', (failure) => forbiddenCopy(failure.message)),
		Match.tag('InvalidLoanPeriod', () => m.endAfterStart()),
		Match.tag('LoanConflict', (failure) =>
			m.loanConflict({
				name: failure.borrowerName,
				start: formatWhen(failure.startsAt),
				end: formatWhen(failure.endsAt),
			}),
		),
		Match.tag('LoanNotFound', () => m.loanMissing()),
		Match.tag('Unauthorized', () => m.requestFailed()),
		Match.tag('HttpClientError', () => m.requestFailed()),
		Match.tag('SchemaError', () => m.requestFailed()),
		Match.exhaustive,
	);

/** Recovers from a shared failure by writing its sentence into the page. */
export const showFailure =
	(setMessage: (message: string) => void) =>
	<A, E extends DeskError, R>(effect: Effect.Effect<A, E, R>) =>
		effect.pipe(
			Effect.catch((error) =>
				Effect.sync(() => {
					setMessage(shown(error));
				}),
			),
		);
