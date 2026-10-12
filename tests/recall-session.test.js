import { expect, it } from 'vitest';
import { createRecallSession } from '../src/recall-session.js';

const entries = Array.from({ length: 12 }, (_, id) =>
  Object.freeze({ id: `word-${id}`, word: `Word ${id}`, meaning: `Meaning ${id}` }),
);
it('creates a bounded unique deck without mutating or retaining the original records', () => {
  const before = JSON.stringify(entries);
  const session = createRecallSession(
    [...entries, entries[0], { ...entries[1], id: 'deleted', deletedAt: '2026-10-12' }],
    { random: () => 0.5 },
  );
  const ids = new Set();
  while (!session.snapshot().done) {
    ids.add(session.snapshot().card.id);
    expect(session.snapshot().card.meaning).toBeNull();
    session.reveal();
    session.rate('remembered');
  }
  expect(ids.size).toBe(10);
  expect(session.snapshot().remembered).toBe(10);
  expect(JSON.stringify(entries)).toBe(before);
});

it('requires revealing before rating and retries only difficult cards in an independent session', () => {
  const session = createRecallSession(entries.slice(0, 2), { random: () => 0.99 });
  session.rate('remembered');
  expect(session.snapshot().completed).toBe(0);
  expect(session.reveal().card.meaning).toBe('Meaning 0');
  session.rate('again');
  session.reveal();
  session.rate('remembered');
  session.rate('again');
  expect(session.snapshot()).toMatchObject({ done: true, remembered: 1, retryCount: 1, total: 2 });
  const retry = session.retryRecords();
  retry[0].word = 'Changed copy';
  expect(session.retryRecords()[0].word).toBe('Word 0');
  expect(createRecallSession(session.retryRecords()).snapshot().total).toBe(1);
  expect(createRecallSession([]).snapshot().done).toBe(true);
});
