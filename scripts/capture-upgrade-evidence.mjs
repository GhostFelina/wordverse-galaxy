import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const base = process.env.WORDVERSE_BASE_URL || 'http://127.0.0.1:5360';
const directory = 'docs/handoff/evidence/upgrade';
const sources = [
  'src/main.js',
  'src/experience-mode.js',
  'src/experience-ui.js',
  'src/premium-bodies.js',
  'src/showcase-scene.js',
  'src/nebula-volume.js',
  'src/cosmic-field.js',
  'src/render-quality.js',
  'tests/fixtures/upgrade-lab.html',
];
const hashes = Object.fromEntries(
  await Promise.all(
    sources.map(async (path) => [
      path,
      createHash('sha256')
        .update(await readFile(path))
        .digest('hex'),
    ]),
  ),
);
const samples = [];
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/tests/fixtures/upgrade-lab.html`);
    await expect(page.locator('canvas')).toHaveAttribute('data-ready', 'true');
    for (const shot of ['far', 'wide', 'star', 'planet', 'gas']) {
      await page.locator(`#${shot}`).click();
      await expect(page.locator('canvas')).toHaveAttribute('data-shot', shot);
      const name = `u2-${shot}-${width}.png`;
      await page.screenshot({ path: `${directory}/${name}` });
      samples.push({
        name,
        width,
        height: 900,
        shot,
        deviceDpr: 1,
        renderDpr: await page.locator('canvas').getAttribute('data-dpr'),
        seed: 4204,
        clock: 0,
        errors: [...errors],
      });
    }
    if ((await page.evaluate(() => localStorage.length)) !== 0)
      throw new Error('Scene fixture wrote persistent storage');
    await page.close();
  }
  await writeFile(
    `${directory}/u2-capture.json`,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        sourceSha256: hashes,
        browser: 'Playwright Chromium',
        platform: process.platform,
        samples,
        userData: false,
        visualAcceptance: 'pending; procedural bodies are artistic, not catalog photographs',
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await browser.close();
}
console.log('15 frozen synthetic upgrade views saved; source hashes identify the working-tree revision.');
