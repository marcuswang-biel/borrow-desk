import type { Role } from '@borrow-desk/api';

import { m } from '../../paraglide/messages.js';
import { defineCustomClientStrategy, getLocale, setLocale } from '../../paraglide/runtime.js';

/** Languages the desk can show. */
export const locales = ['en', 'zh', 'zh-Hant'] as const;

/** One language the desk can show. */
export type Locale = (typeof locales)[number];

/** localStorage key for the chosen language. */
const storageKey = 'borrow-desk.locale';

/** True when the value is one of the desk languages. */
const isLocale = (value: string | null): value is Locale =>
	value === 'en' || value === 'zh' || value === 'zh-Hant';

/** Maps a browser or stored tag onto one desk language. */
const activeLocale = (language: string): Locale => {
	const tag = language.toLowerCase();
	if (
		tag === 'zh-hant' ||
		tag.startsWith('zh-hant') ||
		tag.startsWith('zh-tw') ||
		tag.startsWith('zh-hk') ||
		tag.startsWith('zh-mo')
	) {
		return 'zh-Hant';
	}
	if (tag.startsWith('zh')) {
		return 'zh';
	}
	return 'en';
};

/** BCP 47 tag for the document and for `Intl` dates. */
export const localeTag = (language: string) => {
	const locale = isLocale(language) ? language : activeLocale(language);
	if (locale === 'zh-Hant') {
		return 'zh-Hant';
	}
	if (locale === 'zh') {
		return 'zh-Hans';
	}
	return 'en';
};

/** Reads a stored language. A blocked storage API yields no choice. */
const readStoredLocale = (): Locale | undefined => {
	try {
		const stored = localStorage.getItem(storageKey);
		return isLocale(stored) ? stored : undefined;
	} catch {
		return undefined;
	}
};

defineCustomClientStrategy('custom-desk', {
	getLocale: () => {
		const stored = readStoredLocale();
		if (stored !== undefined) {
			return stored;
		}
		if (typeof navigator === 'undefined') {
			return undefined;
		}
		return activeLocale(navigator.language);
	},
	setLocale: (next) => {
		if (!isLocale(next)) {
			return;
		}
		try {
			localStorage.setItem(storageKey, next);
		} catch {
			// The page still switches for this visit.
		}
	},
});

document.documentElement.lang = localeTag(getLocale());

/** Stores the language and reloads so the new copy and document language arrive together. */
export const changeLocale = (next: Locale) => {
	document.documentElement.lang = localeTag(next);
	setLocale(next);
};

/** Role name in the active language. */
export const roleLabel = (role: Role) => (role === 'admin' ? m.roleAdmin() : m.roleEmployee());

export { getLocale };
