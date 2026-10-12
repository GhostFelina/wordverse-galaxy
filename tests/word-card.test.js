import { expect, it } from 'vitest';
import { wordCardContent } from '../src/word-card.js';

it('exports only the selected word by default, even when a record contains private metadata', () => {
  const record = {
    id: 'private-id',
    word: 'Serendipity',
    meaning: 'A private meaning',
    example: 'A private sentence',
    ownerId: 'private-owner',
    createdAt: 'private-date',
    events: ['private-history'],
  };
  expect(wordCardContent(record)).toEqual({ word: 'Serendipity' });
  expect(wordCardContent(record, { includeMeaning: true })).toEqual({
    word: 'Serendipity',
    meaning: 'A private meaning',
  });
});
