import type { EquipmentError, LoanError, UserError } from '@borrow-desk/api';
import type * as HttpClientError from 'effect/http/HttpClientError';
import type * as Schema from 'effect/Schema';

import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';

import { i18n } from './i18n/index.ts';
import { formatWhen } from './text.ts';

/** Failures the page can show: the shared contract, or the transport around it. */
export type DeskError =
	| EquipmentError
	| LoanError
	| UserError
	| HttpClientError.HttpClientError
	| Schema.SchemaError;

/** Turns a stored English reminder into the active language. */
export const shownReminder = (message: string) => {
	const missing = ' has not returned equipment that is no longer in the catalog';
	if (message.endsWith(missing)) {
		return i18n.t('reminderMissing', { name: message.slice(0, -missing.length) });
	}
	const marker = ' has not returned ';
	const index = message.indexOf(marker);
	if (index < 0) {
		return message;
	}
	const rest = message.slice(index + marker.length);
	const split = rest.lastIndexOf(' ');
	if (split <= 0) {
		return message;
	}
	return i18n.t('reminderBody', {
		name: message.slice(0, index),
		equipment: rest.slice(0, split),
		code: rest.slice(split + 1),
	});
};

/** Sentence for one shared failure, in the active language. */
const forbiddenCopy = (message: string) => {
	switch (message) {
		case 'You can only return your own loan':
			return i18n.t('returnOwnLoan');
		case 'Only an admin can record equipment':
			return i18n.t('adminOnly');
		case 'Equipment name is empty':
			return i18n.t('equipmentNameEmpty');
		case 'Equipment number is empty':
			return i18n.t('equipmentNumberEmpty');
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
	return i18n.t('equipmentCodeTaken', {
		name: message.slice(0, index),
		code: message.slice(index + marker.length),
	});
};

/** Sentence for one shared failure. Transport and decode failures use the active language. */
export const shown = (error: DeskError) =>
	Match.value(error).pipe(
		Match.tag('EquipmentCodeTaken', (failure) => takenCopy(failure.message)),
		Match.tag('EquipmentNotFound', () => i18n.t('equipmentMissing')),
		Match.tag('Forbidden', (failure) => forbiddenCopy(failure.message)),
		Match.tag('InvalidLoanPeriod', () => i18n.t('endAfterStart')),
		Match.tag('LoanConflict', (failure) =>
			i18n.t('loanConflict', {
				name: failure.borrowerName,
				start: formatWhen(failure.startsAt, i18n.language),
				end: formatWhen(failure.endsAt, i18n.language),
			}),
		),
		Match.tag('LoanNotFound', () => i18n.t('loanMissing')),
		Match.tag('Unauthorized', () => i18n.t('requestFailed')),
		Match.tag('HttpClientError', () => i18n.t('requestFailed')),
		Match.tag('SchemaError', () => i18n.t('requestFailed')),
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
