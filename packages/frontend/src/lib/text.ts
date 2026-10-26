import type { Equipment } from '@borrow-desk/api';

import { localeTag } from './i18n/index.ts';

/** Reads one named field from a form. */
export const fieldValue = (form: HTMLFormElement, name: string) => {
	const data = new FormData(form);
	const value = data.get(name);
	return typeof value === 'string' ? value : '';
};

/** Turns a datetime-local value into epoch milliseconds. */
export const toMillis = (value: string) => new Date(value).getTime();

/** Shows a piece as its kind and its number. */
export const equipmentLabel = (item: Equipment) => `${item.name} ${item.code}`;

/** Formats epoch milliseconds in the active language. */
export const formatWhen = (millis: number, language: string) =>
	new Intl.DateTimeFormat(localeTag(language), {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(millis);
