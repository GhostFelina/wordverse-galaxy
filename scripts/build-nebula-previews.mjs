import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const folder = 'public/assets/nebulae/previews';
const base = process.env.WORDVERSE_BASE_URL || 'http://127.0.0.1:5351';
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 768, height: 512 } });
const assets = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
try {
  for (const scene of ['orion', 'ion-veil', 'ember-reach', 'tidal-shell']) {
    await page.goto(`${base}/tests/fixtures/nebula-preview.html?scene=${scene}`);
    await expect(page.locator('#preview')).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
    const file = `${scene}-v2.png`;
    await page.locator('#preview').screenshot({ path: `${folder}/${file}` });
    assets.push({
      file,
      dimensions: [768, 512],
      sha256: createHash('sha256')
        .update(await readFile(`${folder}/${file}`))
        .digest('hex'),
    });
  }
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(
    `${folder}/PROVENANCE.json`,
    JSON.stringify(
      {
        version: 2,
        generator: 'scripts/build-nebula-previews.mjs',
        source: 'Direct deterministic production-volume renders; no vocabulary data or generated bitmap substitutes.',
        assets,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Four native production-volume preview images generated.');
} finally {
  await browser.close();
}
