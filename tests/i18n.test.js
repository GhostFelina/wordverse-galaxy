import { expect, test } from 'vitest';
import { LOCALES, LOCALE_KEY, resolveLocale, translate, formatDate, formatNumber, formatUnit } from '../src/i18n.js';

const leaves = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'string' ? [prefix + key] : leaves(child, `${prefix}${key}.`),
  );

test('all locale files have the same translation keys', () => {
  const reference = leaves(LOCALES.tr).sort();
  for (const locale of ['en', 'es']) expect(leaves(LOCALES[locale]).sort()).toEqual(reference);
});

test('profile, storage, browser and Turkish fallback have strict priority', () => {
  const storage = { getItem: (key) => (key === LOCALE_KEY ? 'es' : null) };
  expect(resolveLocale({ profileLocale: 'en-US', storage, browserLanguage: 'tr-TR' })).toBe('en');
  expect(resolveLocale({ storage, browserLanguage: 'en-US' })).toBe('es');
  expect(resolveLocale({ browserLanguage: 'en-US' })).toBe('en');
  expect(resolveLocale({ browserLanguage: 'de-DE' })).toBe('tr');
});

test('translations interpolate and dates and numbers use the chosen locale', () => {
  expect(translate('es', 'count.star', { count: 2 })).toBe('2 estrellas');
  expect(formatNumber('en', 1000)).toBe('1,000');
  expect(formatDate('tr', '2026-10-02T12:00:00Z')).toContain('Ekim');
  expect(formatUnit('en', 'star', 1)).toBe('1 star');
  expect(formatUnit('en', 'star', 2)).toBe('2 stars');
  expect(formatUnit('es', 'day', 1)).toBe('1 día');
});
