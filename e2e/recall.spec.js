import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const REVIEW_KEY = 'wordverse.reviews.v1:guest-personal:guest';

test('owner and galaxy transitions erase an open recall session; same-owner refresh preserves it', async ({ page }) => {
  await page.goto('/tests/fixtures/recall-lab.html');
  await page.locator('#open-recall').click();
  await page.locator('#recall-reveal').click();
  // Simulate an asynchronous identity notification while the native modal is open.
  await page.evaluate(() => document.querySelector('#same-owner').click());
  await expect(page.locator('#recall-dialog')).toBeVisible();
  await expect(page.locator('.recall-meaning')).toHaveText('Owner A meaning');
  await page.locator('#recall-good').click();
  await page.evaluate(() => document.querySelector('#different-owner').click());
  await expect(page.locator('#recall-dialog')).toBeHidden();
  await expect(page.locator('#recall-dialog')).toBeEmpty();
  // Progress written for owner A is invisible to owner B, who starts with a new word.
  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((key) => key.startsWith('wordverse.reviews')),
  );
  expect(keys).toEqual(['wordverse.reviews.v1:personal:owner-a']);
  await page.locator('#open-recall').click();
  await expect(page.locator('.recall-badge')).toBeVisible();
  await page.evaluate(() => document.querySelector('#different-galaxy').click());
  await expect(page.locator('#recall-dialog')).toBeHidden();
  await expect(page.locator('#recall-dialog')).toBeEmpty();
});

const universe = (words) =>
  JSON.stringify({
    version: 4,
    activeGalaxyId: 'recall-g',
    events: [],
    galaxies: [
      {
        id: 'recall-g',
        name: 'Recall fixture',
        language: 'English',
        meaningLanguage: 'en',
        createdAt: '2026-10-04T09:00:00Z',
      },
    ],
    words,
  });
const fixtureWords = [
  {
    id: 'a',
    galaxyId: 'recall-g',
    word: 'Continuity',
    meaning: 'Hidden answer A',
    example: 'A continuous journey.',
    x: 31,
    y: 0,
    z: 18,
    createdAt: '2026-10-04T09:00:00Z',
  },
  {
    id: 'b',
    galaxyId: 'recall-g',
    word: '<img src=x onerror=alert(1)>',
    meaning: 'Hidden answer B',
    x: 12,
    y: 4,
    z: 18,
    createdAt: '2026-10-04T09:00:00Z',
  },
  {
    id: 'other-galaxy',
    galaxyId: 'other-g',
    word: 'Excluded',
    meaning: 'Not in this galaxy',
    createdAt: '2026-10-04T09:00:00Z',
  },
];

const labels = {
  tr: { completed: 'tamamlandı', good: 'İyi', caughtUp: 'Bugünlük hepsi tamam.' },
  en: { completed: 'completed', good: 'Good', caughtUp: 'All caught up for today.' },
  es: { completed: 'completadas', good: 'Bien', caughtUp: 'Todo al día por hoy.' },
};

for (const [width, locale] of [
  [1440, 'tr'],
  [768, 'en'],
  [390, 'es'],
]) {
  test(`scheduled review persists progress without changing records at ${width}/${locale}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((value) => {
      if (!localStorage.getItem('wordverse.universe.v4')) localStorage.setItem('wordverse.universe.v4', value);
    }, universe(fixtureWords));
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/?lang=${locale}`);
    await expect(page.locator('#app')).toHaveAttribute('data-experience', 'guest-personal');
    const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await expect(page.locator('#home-recall')).toBeVisible();
    await page.locator('#collection-btn').click();
    await expect(page.locator('#open-recall')).toContainText('2');
    await page.locator('#open-recall').click();
    const dialog = page.locator('#recall-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('progress')).toHaveAttribute('max', '2');
    await expect(dialog.locator('progress')).toHaveAttribute('value', '0');
    await expect(dialog.locator('.recall-progress')).toHaveText(`0 / 2 ${labels[locale].completed}`);
    await expect(dialog.locator('.recall-meaning')).toHaveCount(0);
    await expect(dialog.locator('.recall-badge')).toBeVisible();
    const first = await dialog.locator('#recall-word').textContent();
    await page.locator('#recall-reveal').click();
    await expect(dialog.locator('.recall-meaning')).toContainText('Hidden answer');
    await expect(dialog.locator('img')).toHaveCount(0);
    await expect(dialog.locator('.recall-grades button')).toHaveCount(4);
    await expect(page.locator('#recall-good')).toContainText(labels[locale].good);
    await expect(page.locator('#recall-good')).toBeFocused();
    await page.screenshot({ path: test.info().outputPath(`2026-11-01-review-${width}-${locale}.png`) });
    // Keyboard "1" = again: the card returns later in this session.
    await page.keyboard.press('1');
    await expect(dialog.locator('progress')).toHaveAttribute('value', '0');
    await expect(dialog.locator('#recall-word')).not.toHaveText(first);
    await page.locator('#recall-reveal').click();
    await page.locator('#recall-good').click();
    await expect(dialog.locator('progress')).toHaveAttribute('value', '1');
    await expect(dialog.locator('#recall-word')).toHaveText(first);
    await page.locator('#recall-reveal').click();
    await page.keyboard.press('3');
    await expect(page.locator('#recall-finish')).toBeVisible();
    await expect(page.locator('#recall-stats')).toContainText('3');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(dialog).toBeEmpty();
    await expect(page.locator('#collection-btn')).toBeFocused();

    const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), REVIEW_KEY);
    expect(Object.keys(progress.cards).sort()).toEqual(['a', 'b']);
    expect(Object.values(progress.days)[0]).toEqual({ reviewed: 3, again: 1, learned: 2 });
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);

    // Progress survives reload; with nothing due the dialog offers free practice.
    await page.reload();
    await expect(page.locator('#app')).toHaveAttribute('data-experience', 'guest-personal');
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
    await page.locator('#collection-btn').click();
    await page.locator('#open-recall').click();
    await expect(dialog.locator('h2')).toHaveText(labels[locale].caughtUp);
    await page.locator('#recall-practice').click();
    await page.locator('#recall-reveal').click();
    await page.locator('#recall-again').click();
    await page.locator('#recall-reveal').click();
    await page.locator('#recall-remembered').click();
    await expect(page.locator('#recall-retry')).toBeVisible();
    await page.keyboard.press('Escape');
    // Free practice never changes the schedule.
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), REVIEW_KEY)).toEqual(progress);
    expect(errors).toEqual([]);
  });
}

test('backups carry review progress and restore due words', async ({ page }) => {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('wordverse.universe.v4')) localStorage.setItem('wordverse.universe.v4', value);
  }, universe(fixtureWords));
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-experience', 'guest-personal');
  const past = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const card = { due: past, lastReview: past, stability: 3, difficulty: 5, reps: 1, lapses: 0, state: 'review' };
  const backup = JSON.parse(universe(fixtureWords));
  backup.reviews = { version: 1, cards: { a: card, b: card }, days: {} };
  await page.locator('#import-universe').setInputFiles({
    name: 'wordverse-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator('#open-recall')).toHaveAttribute('data-due', '2');
  await expect(page.locator('#open-recall')).toContainText('Review time');
  await expect(page.locator('#home-recall')).toHaveText('2 words ready to review');
  await page.locator('#galaxy-switch').click();
  await expect(page.locator('#galaxy-panel')).toHaveAttribute('aria-hidden', 'false');
  const download = page.waitForEvent('download');
  await page.locator('#export-universe').click();
  const file = await (await download).path();
  const exported = JSON.parse(await readFile(file, 'utf8'));
  expect(Object.keys(exported.reviews.cards).sort()).toEqual(['a', 'b']);
  expect(exported.words.map((word) => word.id).sort()).toEqual(['a', 'b', 'other-galaxy']);
});

test('word detail shows its review schedule after a scheduled session', async ({ page }) => {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('wordverse.universe.v4')) localStorage.setItem('wordverse.universe.v4', value);
  }, universe(fixtureWords));
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await page.locator('#collection-btn').click();
  await page.locator('.collection-item').filter({ hasText: 'Continuity' }).click();
  await expect(page.locator('#detail-review')).toHaveText('Not reviewed yet.');
  await page.locator('#collection-btn').click();
  await page.locator('#open-recall').click();
  for (let i = 0; i < 2; i++) {
    await page.locator('#recall-reveal').click();
    await page.keyboard.press('3');
  }
  await page.keyboard.press('Escape');
  await page.locator('.collection-item').filter({ hasText: 'Continuity' }).click();
  await expect(page.locator('#detail-review')).toContainText('Next review');
  await expect(page.locator('#detail-review')).toContainText('reviewed 1×');
});
