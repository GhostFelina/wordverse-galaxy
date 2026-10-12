import { expect, test } from '@playwright/test';

const labels = {
  tr: {
    words: 'Kelimeler',
    conjunctions: 'Bağlaçlar',
    back: '← Atlasa dön',
    clear: 'Aramayı temizle',
    reset: 'Tüm kayıtları göster',
  },
  en: {
    words: 'Words',
    conjunctions: 'Conjunctions',
    back: '← Back to atlas',
    clear: 'Clear search',
    reset: 'Show all records',
  },
  es: {
    words: 'Palabras',
    conjunctions: 'Conjunciones',
    back: '← Volver al atlas',
    clear: 'Borrar búsqueda',
    reset: 'Mostrar todos los registros',
  },
};
for (const [locale, width, height] of [
  ['tr', 1440, 900],
  ['en', 1280, 800],
  ['es', 1024, 768],
]) {
  test(`desktop atlas filters, sorts and returns from a record without writes at ${width}/${locale}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem(
        'wordverse.universe.v4',
        JSON.stringify({
          version: 4,
          activeGalaxyId: 'atlas-g',
          events: [],
          galaxies: [
            {
              id: 'atlas-g',
              name: 'English atlas',
              language: 'English',
              meaningLanguage: 'tr',
              createdAt: '2026-10-01',
            },
          ],
          words: [
            {
              id: 'new',
              galaxyId: 'atlas-g',
              word: 'Bloom',
              meaning: 'Flourish',
              kind: 'word',
              x: 30,
              y: 0,
              z: 18,
              createdAt: '2026-10-10T09:00:00Z',
            },
            {
              id: 'old',
              galaxyId: 'atlas-g',
              word: 'Continuity',
              meaning: 'Süreklilik',
              kind: 'word',
              x: 42,
              y: 6,
              z: 10,
              createdAt: '2026-10-01T09:00:00Z',
            },
            {
              id: 'join',
              galaxyId: 'atlas-g',
              word: 'However',
              meaning: 'Bununla birlikte',
              kind: 'conjunction',
              planet: 'jupiter',
              x: 45,
              y: -3,
              z: 0,
              createdAt: '2026-10-06T09:00:00Z',
            },
            {
              id: 'long',
              galaxyId: 'atlas-g',
              word: 'An extraordinarily long expression for a compact atlas',
              meaning: 'Uzun bir ifade',
              kind: 'word',
              x: 20,
              y: 8,
              z: 12,
              createdAt: '2026-10-02T09:00:00Z',
            },
          ],
        }),
      );
    });
    await page.goto(`/?lang=${locale}`);
    await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-ready', 'true');
    const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await page.locator('#collection-btn').click();
    const panel = page.locator('#collection-panel');
    const rows = panel.locator('.collection-item');
    const ids = () => rows.evaluateAll((elements) => elements.map((element) => element.dataset.recordId));
    expect(await ids()).toEqual(['new', 'join', 'long', 'old']);
    await panel.getByRole('button', { name: labels[locale].words, exact: true }).click();
    await expect(rows).toHaveCount(3);
    await panel.locator('#atlas-sort').selectOption('oldest');
    expect(await ids()).toEqual(['old', 'long', 'new']);
    await panel.locator('#atlas-sort').selectOption('alphabetical');
    expect(await ids()).toEqual(['long', 'new', 'old']);
    await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    const layout = await panel.evaluate((element) => ({ scroll: element.scrollWidth, width: element.clientWidth }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.width + 1);
    await page.screenshot({ path: `docs/handoff/evidence/2026-10-12-atlas-${width}-${locale}.png` });
    await rows.filter({ hasText: 'Bloom' }).click();
    await expect(page.locator('#detail-word')).toHaveText('Bloom');
    await page.getByRole('button', { name: labels[locale].back, exact: true }).click();
    await expect(panel.locator('#atlas-sort')).toHaveValue('alphabetical');
    await expect(panel.getByRole('button', { name: labels[locale].words, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await panel.locator('#search-input').fill('flourish');
    await expect(rows).toHaveCount(1);
    await panel.getByRole('button', { name: labels[locale].clear, exact: true }).click();
    await expect(rows).toHaveCount(3);
    await panel.getByRole('button', { name: labels[locale].conjunctions, exact: true }).click();
    await expect(rows).toHaveCount(1);
    await panel.locator('#search-input').fill('unmatched');
    await expect(rows).toHaveCount(0);
    await panel.getByRole('button', { name: labels[locale].reset, exact: true }).click();
    await expect(rows).toHaveCount(4);
    await expect(panel.locator('#atlas-sort')).toHaveValue('newest');
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
    expect(errors).toEqual([]);
  });
}
