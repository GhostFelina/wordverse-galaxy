import { entryKind } from './universe-data.js';

// Statistics use only the currently selected guest/account universe.
// They never mutate records or infer review results that do not exist.
export function profileStatistics(universe, now = Date.now()) {
  const galaxies = (universe.galaxies || []).filter((row) => !row.deleted_at && !row.deletedAt);
  const entries = (universe.words || []).filter((row) => !row.deleted_at && !row.deletedAt);
  const galaxyById = new Map(galaxies.map((galaxy) => [galaxy.id, galaxy]));
  const languages = new Map();
  for (const entry of entries) {
    const rawLanguage = galaxyById.get(entry.galaxyId)?.language;
    const language = typeof rawLanguage === 'string' && rawLanguage.trim() ? rawLanguage : null;
    languages.set(language, (languages.get(language) || 0) + 1);
  }
  const dated = entries
    .filter((entry) => {
      const at = Date.parse(entry.createdAt);
      return Number.isFinite(at) && at <= now;
    })
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || String(a.id).localeCompare(String(b.id)));
  return {
    stars: entries.filter((entry) => entryKind(entry) === 'word').length,
    planets: entries.filter((entry) => entryKind(entry) === 'conjunction').length,
    galaxies: galaxies.length,
    languages: [...languages].map(([language, count]) => ({ language, count })),
    oldest: dated[0] ? structuredClone(dated[0]) : null,
    recent: dated
      .slice(-5)
      .reverse()
      .map((entry) => structuredClone(entry)),
  };
}
