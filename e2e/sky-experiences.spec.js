import { expect, test } from '@playwright/test';

async function open(page, motion = 'reduce') {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: motion });
  await page.addInitScript(() =>
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'sky-g',
        events: [],
        galaxies: [
          {
            id: 'sky-g',
            name: 'Synthetic sky',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-12T09:00:00Z',
          },
        ],
        words: [
          {
            id: 'sky-w',
            galaxyId: 'sky-g',
            kind: 'word',
            word: 'Serendipity',
            meaning: 'Private test meaning',
            example: 'Private test example',
            x: 31,
            y: 0,
            z: 18,
            createdAt: '2026-10-12T09:00:00Z',
          },
        ],
      }),
    ),
  );
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
}

test('chosen sky experiences compile, stay still with reduced motion and never write learning data', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await open(page);
  const canvas = page.locator('#universe');
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await expect(canvas).toHaveAttribute('data-sky-event', '');
  await page.locator('#scene-controls summary').click();
  for (const [kind, time] of [
    ['meteor', '2.6'],
    ['supernova', '8'],
    ['blackhole', '0'],
  ]) {
    await page.locator(`[data-sky-event="${kind}"]`).click();
    await expect(canvas).toHaveAttribute('data-sky-event', kind);
    await expect(canvas).toHaveAttribute('data-sky-event-time', time);
    await expect(page.locator('.sky-event-status')).toContainText('Artistic illustration');
    await expect(page.locator('[data-word-id="sky-w"]')).toBeVisible();
  }
  await page.locator('.sky-event-status button').click();
  await expect(canvas).toHaveAttribute('data-sky-event', '');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  expect(errors).toEqual([]);
});

test('nebula depth slider, wheel reversal and buttons share one stable cruise', async ({ page }) => {
  await open(page);
  const canvas = page.locator('#universe');
  await page.locator('#open-nebulae').click();
  await page.locator('[data-nebula="orion"]').click();
  await expect(page.locator('#nebula-navigation')).toBeVisible();
  await page.locator('#nebula-depth').fill('50');
  await expect
    .poll(async () =>
      Math.abs(
        Number(await canvas.getAttribute('data-camera-z')) - Number(await canvas.getAttribute('data-camera-target-z')),
      ),
    )
    .toBeLessThan(2);
  const x = Number(await canvas.getAttribute('data-camera-x'));
  await page.mouse.move(920, 450);
  await page.mouse.wheel(0, -180);
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-target-z'))).toBeLessThan(-1000);
  await page.mouse.wheel(0, 180);
  await page.locator('#zoom-out').click();
  expect(Math.abs(Number(await canvas.getAttribute('data-camera-x')) - x)).toBeLessThan(1);
  await page.locator('#nebula-navigation button').click();
  await expect(page.locator('#nebula-navigation')).toBeHidden();
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(159);
  await expect(page.locator('[data-word-id="sky-w"]')).toBeVisible();
});

test('star cards are opt-in, default to hidden meaning and download the requested format without record writes', async ({
  page,
}) => {
  await open(page);
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('[data-word-id="sky-w"]').click();
  await expect(page.locator('.detail-visual')).toHaveAttribute('data-stellar-preview', 'ready');
  await page.locator('#share-word').click();
  await expect(page.locator('#word-card-meaning')).not.toBeChecked();
  await expect(page.locator('#word-card-download')).toBeEnabled();
  expect(await page.locator('.word-card-image').evaluate((img) => [img.naturalWidth, img.naturalHeight])).toEqual([
    1080, 1080,
  ]);
  await page.locator('#word-card-format').selectOption('portrait');
  await expect(page.locator('#word-card-dialog [role="status"]')).toHaveText('1080 × 1350 · PNG');
  const pending = page.waitForEvent('download');
  await page.locator('#word-card-download').click();
  expect((await pending).suggestedFilename()).toBe('wordverse-star.png');
  await page.getByRole('button', { name: 'Close card', exact: true }).click();
  await page.locator('#share-word').click();
  await expect(page.locator('#word-card-meaning')).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
});

test('long card titles and opted-in meanings remain above the footer in both formats', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const { renderWordCard } = await import('/src/word-card.js');
    await document.fonts.ready;
    const original = CanvasRenderingContext2D.prototype.fillText;
    const measurements = [];
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
      measurements.push({ text, y, height: Number(this.font.match(/([\d.]+)px/)[1]) });
      return original.call(this, text, x, y);
    };
    try {
      const checks = [];
      for (const portrait of [false, true]) {
        measurements.length = 0;
        renderWordCard(
          {
            word: 'A very long vocabulary expression with several extraordinary discoveries',
            meaning:
              'An intentionally included meaning that also wraps across multiple lines and must remain clear of the footer and frame.',
          },
          null,
          portrait,
        );
        const footer = measurements.find((row) => row.text === 'wordverse-galaxy.vercel.app');
        const content = measurements.filter((row) => row.y > 600 && row !== footer);
        checks.push(content.length > 2 && content.every((row) => row.y + row.height + 12 < footer.y));
      }
      return checks;
    } finally {
      CanvasRenderingContext2D.prototype.fillText = original;
    }
  });
  expect(result).toEqual([true, true]);
});

test('a stalled initial auth refresh opens guest learning and a late expired-session response preserves it', async ({
  page,
}) => {
  // Fake, expired SDK session. No real account or credentials are accessed.
  await page.addInitScript(() =>
    localStorage.setItem(
      'sb-wordverse-auth-auth-token',
      JSON.stringify({
        access_token: 'synthetic-expired',
        refresh_token: 'synthetic-refresh',
        expires_at: 1,
        expires_in: 1,
        token_type: 'bearer',
        user: { id: 'late-synthetic-owner' },
      }),
    ),
  );
  let release;
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/auth/v1/token**', async (route) => {
    await hold;
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', error_description: 'Synthetic expired session' }),
    });
  });
  try {
    await open(page);
    await expect(page.locator('#app')).toHaveAttribute('data-experience', 'guest-personal');
    await expect(page.locator('[data-word-id="sky-w"]')).toBeVisible();
  } finally {
    release();
  }
});
