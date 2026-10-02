import tr from '../locales/tr.json';
import en from '../locales/en.json';
import es from '../locales/es.json';

export const LOCALES = Object.freeze({ tr, en, es });
export const LOCALE_KEY = 'wordverse.ui.locale';

export function normalizeLocale(value) {
  const code = String(value || '')
    .toLowerCase()
    .split(/[-_]/)[0];
  return Object.hasOwn(LOCALES, code) ? code : null;
}

export function resolveLocale({ profileLocale, storage, browserLanguage } = {}) {
  let saved = null;
  try {
    saved = storage?.getItem(LOCALE_KEY);
  } catch {
    /* Browser storage can be unavailable. */
  }
  return normalizeLocale(profileLocale) || normalizeLocale(saved) || normalizeLocale(browserLanguage) || 'tr';
}

export function translate(locale, key, params = {}) {
  const message = key.split('.').reduce((value, part) => value?.[part], LOCALES[locale] || LOCALES.tr);
  if (typeof message !== 'string') throw new Error(`Missing ${locale} translation: ${key}`);
  return message.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

export function formatDate(locale, value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat({ tr: 'tr-TR', en: 'en-US', es: 'es-ES' }[locale] || 'tr-TR', options).format(
    new Date(value),
  );
}

export function formatNumber(locale, value) {
  return new Intl.NumberFormat({ tr: 'tr-TR', en: 'en-US', es: 'es-ES' }[locale] || 'tr-TR').format(value);
}
