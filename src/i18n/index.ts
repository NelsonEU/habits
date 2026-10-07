import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

const SUPPORTED = ['en', 'fr'];

/*
 * The first of the phone's preferred languages that the app supports, else
 * English. iOS restarts the app when its language changes (Settings › Habits
 * › Language), so reading this once at startup is enough.
 */
const match = getLocales().find((l) => SUPPORTED.includes(l.languageCode ?? ''));

/** Full locale for dates and numbers, keeping the region ("en-GB" writes "Monday 5 October"). */
export const locale = match?.languageTag ?? 'en-US';

const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: match?.languageCode ?? 'en',
  fallbackLng: 'en',
  // Translations are bundled: initialize synchronously so the first render is translated.
  initAsync: false,
  // React already escapes text.
  interpolation: { escapeValue: false },
});

export default i18n;
