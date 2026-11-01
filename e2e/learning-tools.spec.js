import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const universe = {
  version: 4,
  activeGalaxyId: 'g',
  events: [],
  galaxies: [
    { id: 'g', name: 'Tools fixture', language: 'English', meaningLanguage: 'en', createdAt: '2026-10-04T09:00:00Z' },
  ],
  words: [
    { id: 'a', galaxyId: 'g', word: 'Harbor', meaning: 'liman', x: 31, y: 0, z: 18, createdAt: '2026-10-04T09:00:00Z' },
  ],
};

async function seed(page, { voices = [] } = {}) {
  await page.addInitScript(
    ({ value, voices }) => {
      if (!localStorage.getItem('wordverse.universe.v4')) localStorage.setItem('wordverse.universe.v4', value);
      // Deterministic on-device voices; spoken utterances are recorded instead of played.
      window.__spoken = [];
      const listeners = {};
      const synth = {
        getVoices: () => voices,
        speak: (utterance) => window.__spoken.push({ text: utterance.text, lang: utterance.lang }),
        cancel: () => {},
        addEventListener: (name, fn) => (listeners[name] = fn),
      };
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
      window.SpeechSynthesisUtterance = class {
        constructor(text) {
          this.text = text;
        }
      };
    },
    { value: JSON.stringify(universe), voices },
  );
}

test('pronunciation uses a local voice in details and recall, and hides without one', async ({ page }) => {
  await seed(page, { voices: [{ lang: 'en-GB', localService: true, default: true, name: 'Local' }] });
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await page.locator('#collection-btn').click();
  await page.locator('.collection-item').filter({ hasText: 'Harbor' }).click();
  const speak = page.locator('#speak-word');
  await expect(speak).toBeVisible();
  await expect(speak).toHaveAttribute('aria-label', 'Listen to Harbor');
  await speak.click();
  await page.keyboard.press('Escape');
  await page.locator('#collection-btn').click();
  await page.locator('#open-recall').click();
  await page.locator('#recall-speak').click();
  expect(await page.evaluate(() => window.__spoken)).toEqual([
    { text: 'Harbor', lang: 'en-GB' },
    { text: 'Harbor', lang: 'en-GB' },
  ]);
});

test('pronunciation stays hidden when only remote voices exist', async ({ page }) => {
  await seed(page, { voices: [{ lang: 'en-US', localService: false, default: true, name: 'Cloud' }] });
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await page.locator('#collection-btn').click();
  await page.locator('.collection-item').filter({ hasText: 'Harbor' }).click();
  await expect(page.locator('#detail-word')).toHaveText('Harbor');
  await expect(page.locator('#speak-word')).toBeHidden();
});

test('bulk import previews, skips duplicates, adds words and exports CSV', async ({ page }) => {
  await seed(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await page.locator('#galaxy-switch').click();
  await expect(page.locator('#galaxy-panel')).toHaveAttribute('aria-hidden', 'false');
  const csv =
    'word,meaning,example\nharbor,again,\nlighthouse,"deniz feneri, kule",A lighthouse.\nanchor,çapa,\nLighthouse,dup,\n,missing,\n';
  await page
    .locator('#import-vocabulary')
    .setInputFiles({ name: 'words.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  const dialog = page.locator('#bulk-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.bulk-summary dd')).toHaveText(['2', '2', '1']);
  await expect(dialog.locator('.bulk-preview strong')).toHaveText(['lighthouse', 'anchor']);
  await page.locator('#bulk-confirm').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#toast')).toHaveText('2 words added to your universe.');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('wordverse.universe.v4')));
  const added = stored.words.filter((word) => word.id !== 'a');
  expect(added.map((word) => [word.word, word.meaning, word.example, word.galaxyId, word.kind])).toEqual([
    ['lighthouse', 'deniz feneri, kule', 'A lighthouse.', 'g', 'word'],
    ['anchor', 'çapa', '', 'g', 'word'],
  ]);
  for (const word of added) for (const axis of ['x', 'y', 'z']) expect(Number.isFinite(word[axis])).toBe(true);
  expect(stored.events.filter((event) => event.type === 'word.created')).toHaveLength(2);
  expect(stored.words.find((word) => word.id === 'a')).toEqual(universe.words[0]);

  await expect(page.locator('#galaxy-panel')).toHaveAttribute('aria-hidden', 'false');
  const download = page.waitForEvent('download');
  await page.locator('#export-vocabulary').click();
  const file = await (await download).path();
  const text = await readFile(file, 'utf8');
  expect(text.startsWith('﻿word,meaning,example,kind,createdAt')).toBe(true);
  expect(text).toContain('"deniz feneri, kule"');
  expect(text.split('\r\n').filter(Boolean)).toHaveLength(4);
  expect(errors).toEqual([]);
});
