import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('docs/handoff/evidence', { recursive: true });
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto('http://127.0.0.1:5360/tests/fixtures/celestial-lab.html');
  await expect(page.locator('canvas')).toHaveAttribute('data-nebulae', '200');
  await page.locator('#open-catalog').click();
  await page.locator('#catalog-search').fill('M42');
  await page.screenshot({ path: `docs/handoff/evidence/2026-10-03-nebula-catalog-${width}.png` });
  await page.locator('[data-catalog-id="NGC1976"]').click();
  await expect
    .poll(async () => Math.abs(Number(await page.locator('canvas').getAttribute('data-camera-z')) - 30))
    .toBeLessThan(2);
  await page.screenshot({ path: `docs/handoff/evidence/2026-10-03-nebula-flight-${width}.png` });
  await page.close();
}
await browser.close();
