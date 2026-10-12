// A short, read-only recall session. Ratings are session-local, never domain writes.
export function createRecallSession(records, { limit = 10, random = Math.random } = {}) {
  const seen = new Set();
  const deck = records
    .filter((record) => {
      if (!record?.id || !record.word || record.deletedAt || seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    })
    .map((record) => ({
      id: record.id,
      word: record.word,
      meaning: record.meaning || '',
      example: record.example || '',
    }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  deck.length = Math.min(deck.length, Math.max(0, Math.floor(limit)));
  let index = 0,
    revealed = false,
    remembered = 0;
  const retry = [];
  const snapshot = () => ({
    total: deck.length,
    completed: index,
    remembered,
    retryCount: retry.length,
    done: index >= deck.length,
    revealed,
    card: deck[index]
      ? {
          id: deck[index].id,
          word: deck[index].word,
          meaning: revealed ? deck[index].meaning : null,
          example: revealed ? deck[index].example : null,
        }
      : null,
  });
  return {
    snapshot,
    reveal() {
      if (index < deck.length) revealed = true;
      return snapshot();
    },
    rate(value) {
      if (!revealed || index >= deck.length || !['remembered', 'again'].includes(value)) return snapshot();
      if (value === 'remembered') remembered++;
      else retry.push({ ...deck[index] });
      index++;
      revealed = false;
      return snapshot();
    },
    retryRecords() {
      return retry.map((record) => ({ ...record }));
    },
  };
}
