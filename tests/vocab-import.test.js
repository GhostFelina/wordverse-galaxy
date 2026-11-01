import { describe, expect, it } from 'vitest';
import { parseDelimited, parseVocabulary, planImport, plainField, toCsv } from '../src/vocab-import.js';

describe('vocabulary parsing', () => {
  it('reads CSV with a Turkish header, quotes, escaped quotes and embedded newlines', () => {
    const text =
      '\uFEFFKelime,Anlam,Örnek\r\nserendipity,"şans eseri, güzel bir rastlantı","He said ""yes"".\nThen left."\r\nlake,göl,\r\n';
    const result = parseVocabulary(text);
    expect(result).toMatchObject({ format: 'csv', header: true, skipped: [] });
    expect(result.rows).toEqual([
      {
        word: 'serendipity',
        meaning: 'şans eseri, güzel bir rastlantı',
        example: 'He said "yes".\nThen left.',
        line: 2,
      },
      { word: 'lake', meaning: 'göl', example: '', line: 4 },
    ]);
  });

  it('detects TSV and semicolon files without a header and reports incomplete rows', () => {
    expect(parseVocabulary('casa\thouse\nperro\tdog\tEl perro.\n').rows.map((row) => row.example)).toEqual([
      '',
      'El perro.',
    ]);
    const semicolon = parseVocabulary('Palabra;Significado\nhola;merhaba\nsolo;\n');
    expect(semicolon.format).toBe('csv-semicolon');
    expect(semicolon.rows).toHaveLength(1);
    expect(semicolon.skipped).toEqual([{ line: 3, reason: 'missing' }]);
  });

  it('understands Anki plain-text exports with HTML, media and entities', () => {
    const text =
      '#separator:tab\n#html:true\n#notetype column:1\nbon<b>jour</b>[sound:bonjour.mp3]\tmerhaba&nbsp;/ iyi günler<br>selam\n';
    const result = parseVocabulary(text);
    expect(result.format).toBe('anki');
    expect(result.rows).toEqual([{ word: 'bonjour', meaning: 'merhaba / iyi günler\nselam', example: '', line: 4 }]);
  });

  it('maps header columns in any order and enforces the row limit', () => {
    const result = parseVocabulary('example,meaning,word\nA cat.,kedi,cat\nA dog.,köpek,dog\nA cow.,inek,cow\n', {
      maxRows: 2,
    });
    expect(result.rows.map((row) => [row.word, row.meaning, row.example])).toEqual([
      ['cat', 'kedi', 'A cat.'],
      ['dog', 'köpek', 'A dog.'],
    ]);
    expect(result.skipped).toEqual([{ line: 4, reason: 'limit' }]);
  });

  it('decodes numeric entities safely and keeps a raw parser available', () => {
    expect(plainField('caf&#233; &#x1F600; &#0; &unknown;')).toBe('café 😀  &unknown;');
    expect(parseDelimited('a,b\n"c,d",e', ',').map((row) => row.cells)).toEqual([
      ['a', 'b'],
      ['c,d', 'e'],
    ]);
  });
});

describe('import planning and CSV export', () => {
  it('skips existing words and repeats within the file using language-aware matching', () => {
    const rows = [
      { word: 'İstanbul', meaning: 'city', example: '', line: 1 },
      { word: 'istanbul', meaning: 'again', example: '', line: 2 },
      { word: 'Ankara', meaning: 'capital', example: '', line: 3 },
      { word: 'izmir', meaning: ' ', example: '', line: 4 },
    ];
    const plan = planImport(rows, [{ id: 'x', word: 'ankara' }], { language: 'Türkçe' });
    expect(plan.add.map((entry) => entry.word)).toEqual(['İstanbul']);
    expect(plan.duplicates.map((entry) => entry.line)).toEqual([2, 3]);
    expect(plan.invalid).toEqual([{ line: 4, reason: 'missing' }]);
  });

  it('exports UTF-8 CSV that round-trips and neutralizes spreadsheet formulas', () => {
    const csv = toCsv([
      { word: 'çay', meaning: 'tea, "black"', example: 'line 1\nline 2', createdAt: '2026-10-01T00:00:00Z' },
      { word: '=HYPERLINK("x")', meaning: '-1', kind: 'conjunction' },
    ]);
    expect(csv.startsWith('\uFEFFword,meaning,example,kind,createdAt\r\n')).toBe(true);
    const back = parseVocabulary(csv).rows;
    expect(back[0]).toMatchObject({ word: 'çay', meaning: 'tea, "black"', example: 'line 1\nline 2' });
    expect(back[1].word).toBe('\'=HYPERLINK("x")');
    expect(back[1].meaning).toBe("'-1");
  });
});
