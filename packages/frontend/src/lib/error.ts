import type { EquipmentError, LoanError, UserError } from '@borrow-desk/api';
import type * as HttpClientError from 'effect/http/HttpClientError';
import type * as Schema from 'effect/Schema';

import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';

import { i18n } from './i18n/index.ts';

/** Failures the page can show: the shared contract, or the transport around it. */
export type DeskError =
	| EquipmentError
	| LoanError
	| UserError
	| HttpClientError.HttpClientError
	| Schema.SchemaError;

/** Sentence for one shared failure. Transport and decode failures use the active language. */
export const shown = (error: DeskError) =>
	Match.value(error).pipe(
		Match.tag('EquipmentCodeTaken', (failure) => failure.message),
		Match.tag('EquipmentNotFound', (failure) => failure.message),
		Match.tag('Forbidden', (failure) => failure.message),
		Match.tag('InvalidLoanPeriod', (failure) => failure.message),
		Match.tag('LoanConflict', (failure) => failure.message),
		Match.tag('LoanNotFound', (failure) => failure.message),
		Match.tag('Unauthorized', (failure) => failure.message),
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
