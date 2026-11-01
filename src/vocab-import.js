// Bulk vocabulary import/export: CSV, TSV, semicolon CSV and Anki plain-text
// exports. Pure functions; the UI decides placement and persistence.
import { findDuplicate, readEntryFields } from './word-records.js';

export const MAX_IMPORT_ROWS = 5000;
export const MAX_IMPORT_BYTES = 2_000_000;

const HEADER_NAMES = {
  word: ['word', 'term', 'front', 'kelime', 'sözcük', 'sozcuk', 'palabra', 'término', 'termino', 'question'],
  meaning: [
    'meaning',
    'definition',
    'translation',
    'back',
    'anlam',
    'anlamı',
    'çeviri',
    'ceviri',
    'significado',
    'traducción',
    'traduccion',
    'answer',
  ],
  example: ['example', 'sentence', 'örnek', 'ornek', 'örnek cümle', 'ejemplo', 'frase'],
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Anki fields may contain HTML, media tags and entities; keep readable text only. */
export function plainField(value) {
  return String(value ?? '')
    .replace(/\[sound:[^\]]*\]/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code) => {
      if (code[0] === '#') {
        const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
      }
      return ENTITIES[code.toLowerCase()] ?? match;
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectDelimiter(lines, declared) {
  if (declared) return declared;
  const sample = lines.slice(0, 20);
  const score = (char) => sample.reduce((sum, line) => sum + (line.split(char).length - 1), 0);
  const candidates = [
    ['\t', score('\t')],
    [';', score(';')],
    [',', score(',')],
  ];
  const [best] = candidates.sort((a, b) => b[1] - a[1]);
  return best[1] > 0 ? best[0] : '\t';
}

/** RFC 4180-style parser with quoted fields, escaped quotes and embedded newlines. */
export function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [],
    field = '',
    quoted = false,
    line = 1,
    rowLine = 1;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else {
        if (char === '\n') line++;
        field += char;
      }
    } else if (char === '"' && field === '') quoted = true;
    else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push({ cells: row, line: rowLine });
      row = [];
      field = '';
      line++;
      rowLine = line;
    } else field += char;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push({ cells: row, line: rowLine });
  }
  return rows;
}

function headerMap(cells) {
  const normalized = cells.map((cell) => plainField(cell).toLocaleLowerCase('tr').replace(/[:*]/g, '').trim());
  const map = {};
  for (const [key, names] of Object.entries(HEADER_NAMES)) {
    const index = normalized.findIndex((cell) => names.includes(cell));
    if (index >= 0) map[key] = index;
  }
  return map.word !== undefined && map.meaning !== undefined ? map : null;
}

/**
 * Parse a vocabulary file. Returns { rows, skipped, format } where rows are
 * { word, meaning, example, line } and skipped lists { line, reason }.
 */
export function parseVocabulary(text, { maxRows = MAX_IMPORT_ROWS } = {}) {
  let source = String(text ?? '').replace(/^\uFEFF/, '');
  // Anki plain-text exports start with "#key:value" header lines.
  const directives = {};
  const lines = source.split(/\r?\n/);
  let start = 0;
  while (start < lines.length && /^#[a-z ]+:/i.test(lines[start])) {
    const [, key, value] = lines[start].match(/^#([a-z ]+):(.*)$/i);
    directives[key.trim().toLowerCase()] = value.trim();
    start++;
  }
  const anki = start > 0;
  source = lines.slice(start).join('\n');
  const named = { tab: '\t', comma: ',', semicolon: ';', pipe: '|', space: ' ' };
  const declared = directives.separator ? (named[directives.separator.toLowerCase()] ?? directives.separator[0]) : null;
  const delimiter = detectDelimiter(lines.slice(start).filter(Boolean), declared);
  const parsed = parseDelimited(source, delimiter).filter((row) => row.cells.some((cell) => cell.trim()));
  const lineOffset = start;
  let columns = { word: 0, meaning: 1, example: 2 };
  let body = parsed;
  const header = parsed[0] && headerMap(parsed[0].cells);
  if (header) {
    columns = { example: undefined, ...header };
    body = parsed.slice(1);
  }
  const rows = [];
  const skipped = [];
  for (const { cells, line } of body) {
    const at = line + lineOffset;
    if (rows.length >= maxRows) {
      skipped.push({ line: at, reason: 'limit' });
      continue;
    }
    const pick = (index) => (index === undefined ? '' : plainField(cells[index]));
    const word = pick(columns.word);
    const meaning = pick(columns.meaning);
    if (!word || !meaning) {
      skipped.push({ line: at, reason: 'missing' });
      continue;
    }
    rows.push({ word, meaning, example: pick(columns.example), line: at });
  }
  const format = anki ? 'anki' : delimiter === '\t' ? 'tsv' : delimiter === ';' ? 'csv-semicolon' : 'csv';
  return { rows, skipped, format, header: Boolean(header) };
}

/** Split parsed rows into new entries, duplicates (existing or repeated in the file) and invalid rows. */
export function planImport(rows, existing, { language } = {}) {
  const add = [];
  const duplicates = [];
  const invalid = [];
  const seen = [];
  for (const row of rows) {
    const entry = readEntryFields({ kind: 'word', word: row.word, meaning: row.meaning, example: row.example });
    if (entry.error) {
      invalid.push({ line: row.line, reason: 'missing' });
      continue;
    }
    const known = findDuplicate(existing, entry.fields.word, { language });
    const repeated = findDuplicate(seen, entry.fields.word, { language });
    if (known || repeated) {
      duplicates.push({ line: row.line, word: entry.fields.word });
      continue;
    }
    seen.push({ id: `import-${row.line}`, word: entry.fields.word });
    add.push({ ...entry.fields, line: row.line });
  }
  return { add, duplicates, invalid };
}

const csvCell = (value) => {
  const text = String(value ?? '');
  // Neutralize spreadsheet formulas (CSV injection) and quote when needed.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** UTF-8 CSV with BOM so spreadsheet apps keep non-Latin characters. */
export function toCsv(records) {
  const lines = [['word', 'meaning', 'example', 'kind', 'createdAt'].join(',')];
  for (const record of records)
    lines.push(
      [
        record.word,
        record.meaning,
        record.example || '',
        record.kind === 'conjunction' ? 'conjunction' : 'word',
        record.createdAt || '',
      ]
        .map(csvCell)
        .join(','),
    );
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
