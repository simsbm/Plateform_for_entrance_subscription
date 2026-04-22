import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '../locales/fr.json';
import en from '../locales/en.json';

export const LANG_KEY = 'supptic_lang';

const savedLang = localStorage.getItem(LANG_KEY) ?? 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export function setLang(lang: 'fr' | 'en') {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
}

export default i18n;
