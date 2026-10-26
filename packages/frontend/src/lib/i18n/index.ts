import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en.ts';
import { zh } from './zh.ts';

/** Languages the desk can show. */
export const locales = ['en', 'zh'] as const;

/** One language the desk can show. */
export type Locale = (typeof locales)[number];

/** localStorage key for the chosen language. */
const storageKey = 'borrow-desk.locale';

/** BCP 47 tag for the document and for `Intl` dates. */
export const localeTag = (language: string) => (language.startsWith('zh') ? 'zh-Hans' : 'en');

/** Reads a stored language. A blocked storage API yields no choice. */
const readStoredLocale = (): Locale | undefined => {
	try {
		const stored = localStorage.getItem(storageKey);
		if (stored === 'en' || stored === 'zh') {
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
	return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
};

/** Language chosen before the first render. */
const initialLocale = readLocale();

document.documentElement.lang = localeTag(initialLocale);

void i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		zh: { translation: zh },
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
