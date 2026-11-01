import { describe, expect, it } from 'vitest';
import { cleanText, comparisonKey, findDuplicate, languageCode, readEntryFields } from '../src/word-records.js';

describe('galaxy language detection', () => {
  it('recognizes seeded Turkish names and the English/Spanish/native spellings users type', () => {
    expect(languageCode('İngilizce')).toBe('en');
    expect(languageCode('İspanyolca')).toBe('es');
    expect(languageCode('Spanish')).toBe('es');
    expect(languageCode(' Español ')).toBe('es');
    expect(languageCode('Türkçe')).toBe('tr');
    expect(languageCode('ITALIAN')).toBe('it');
    expect(languageCode('Deutsch')).toBe('de');
    expect(languageCode('Klingon')).toBeUndefined();
    expect(languageCode(undefined)).toBeUndefined();
  });
});

describe('duplicate detection', () => {
  const records = [
    { id: '1', word: 'İstanbul' },
    { id: '2', word: 'Ice  cream' },
    { id: '3', word: 'café' },
  ];

  it('folds Turkish dotted capitals correctly in a Turkish galaxy', () => {
    expect(comparisonKey('İstanbul', 'Türkçe')).toBe('istanbul');
    expect(findDuplicate(records, 'istanbul', { language: 'Türkçe' })?.id).toBe('1');
    // English folding would produce "i̇stanbul" and miss the duplicate.
    expect('İstanbul'.toLocaleLowerCase('en')).not.toBe('istanbul');
  });

  it('ignores extra whitespace and Unicode composition differences', () => {
    expect(findDuplicate(records, ' ice cream ', { language: 'English' })?.id).toBe('2');
    expect(findDuplicate(records, 'café', { language: 'Français' })?.id).toBe('3');
  });

  it('skips the record being edited and handles unknown languages', () => {
    expect(findDuplicate(records, 'Ice cream', { language: 'English', ignoreId: '2' })).toBeNull();
    expect(findDuplicate(records, 'ICE CREAM', { language: 'Klingon' })?.id).toBe('2');
    expect(findDuplicate(records, '   ', { language: 'English' })).toBeNull();
  });
});

describe('entry fields', () => {
  it('normalizes the word, keeps multi-line meanings and requires word and meaning', () => {
    expect(
      readEntryFields({ kind: 'conjunction', word: '  and   yet ', meaning: ' line 1\nline 2 ', example: '' }),
    ).toEqual({
      fields: { kind: 'conjunction', word: 'and yet', meaning: 'line 1\nline 2', example: '' },
    });
    expect(readEntryFields({ kind: 'planet', word: 'x', meaning: 'y' }).fields.kind).toBe('word');
    expect(readEntryFields({ word: 'x', meaning: '  ' })).toEqual({ error: 'required' });
    expect(cleanText('a \tb')).toBe('a b');
  });
});
