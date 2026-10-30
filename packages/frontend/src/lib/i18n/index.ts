import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en.ts';
import { zhHant } from './zh-Hant.ts';
import { zh } from './zh.ts';

/** Languages the desk can show. */
export const locales = ['en', 'zh', 'zh-Hant'] as const;

/** One language the desk can show. */
export type Locale = (typeof locales)[number];

/** localStorage key for the chosen language. */
const storageKey = 'borrow-desk.locale';

/** Maps a browser or stored tag onto one desk language. */
export const activeLocale = (language: string): Locale => {
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
	const locale = activeLocale(language);
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
		if (stored === 'en' || stored === 'zh' || stored === 'zh-Hant') {
			return stored;
		}
	} catch {
		return undefined;
	}
	return undefined;
};

/** Picks Chinese when the browser asks for it and nothing is stored. */
export const readLocale = (): Locale => {
	const stored = readStoredLocale();
	if (stored !== undefined) {
		return stored;
	}
	return activeLocale(navigator.language);
};

/** Language chosen before the first render. */
const initialLocale = readLocale();

document.documentElement.lang = localeTag(initialLocale);

void i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		zh: { translation: zh },
		'zh-Hant': { translation: zhHant },
	},
	lng: initialLocale,
	fallbackLng: 'en',
	interpolation: { escapeValue: false },
});

/** Stores the language and applies it to i18next and the document. */
export const changeLocale = (next: Locale) => {
	try {
		localStorage.setItem(storageKey, next);
	} catch {
		// The page still switches for this visit.
	}
	document.documentElement.lang = localeTag(next);
	return i18n.changeLanguage(next);
};

export { i18n };
