// Pure vocabulary-record rules shared by the add/edit form: field
// normalization, galaxy language detection and duplicate detection.
// Scene placement, persistence and UI stay in main.js.

// Free-text galaxy languages as users and seeds write them, mapped to BCP 47.
const LANGUAGE_CODES = new Map(
  Object.entries({
    en: ['english', 'ingilizce', 'inglés', 'ingles'],
    es: ['spanish', 'ispanyolca', 'español', 'espanol'],
    tr: ['turkish', 'türkçe', 'turkce', 'turco'],
    de: ['german', 'almanca', 'deutsch', 'alemán', 'aleman'],
    fr: ['french', 'fransızca', 'fransizca', 'français', 'francais', 'francés', 'frances'],
    it: ['italian', 'italyanca', 'italiano'],
    pt: ['portuguese', 'portekizce', 'português', 'portugues'],
    ru: ['russian', 'rusça', 'rusca', 'русский'],
    az: ['azerbaijani', 'azerice', 'azərbaycan'],
    ja: ['japanese', 'japonca', '日本語'],
    ko: ['korean', 'korece', '한국어'],
    zh: ['chinese', 'çince', 'cince', '中文'],
    ar: ['arabic', 'arapça', 'arapca', 'العربية'],
  }).flatMap(([code, names]) => names.map((name) => [name, code])),
);

/** Best-effort BCP 47 code for a galaxy's free-text language, or undefined. */
export function languageCode(language) {
  const key = String(language || '')
    .trim()
    .toLocaleLowerCase('tr')
    .normalize('NFC');
  if (LANGUAGE_CODES.has(key)) return LANGUAGE_CODES.get(key);
  // Turkish lowercasing maps "I" to "ı"; retry with neutral casing for English names.
  return LANGUAGE_CODES.get(
    String(language || '')
      .trim()
      .toLowerCase()
      .normalize('NFC'),
  );
}

/** Trim, collapse inner whitespace and use one Unicode form for stored text. */
export const cleanText = (value) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

/** Comparison key: language-aware case folding of cleaned text. */
export function comparisonKey(word, language) {
  const code = languageCode(language);
  const text = cleanText(word);
  try {
    return text.toLocaleLowerCase(code);
  } catch {
    return text.toLowerCase();
  }
}

/** The existing record with the same word in this galaxy's language, if any. */
export function findDuplicate(records, word, { language, ignoreId = null } = {}) {
  const key = comparisonKey(word, language);
  if (!key) return null;
  return records.find((record) => record.id !== ignoreId && comparisonKey(record.word, language) === key) || null;
}

/** Normalize add/edit form input; returns { fields } or { error }. */
export function readEntryFields({ kind, word, meaning, example }) {
  const fields = {
    kind: kind === 'conjunction' ? 'conjunction' : 'word',
    word: cleanText(word),
    meaning: String(meaning ?? '')
      .normalize('NFC')
      .trim(),
    example: String(example ?? '')
      .normalize('NFC')
      .trim(),
  };
  if (!fields.word || !fields.meaning) return { error: 'required' };
  return { fields };
}
