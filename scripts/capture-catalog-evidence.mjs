import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const directory = 'docs/handoff/evidence';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    colorScheme: width === 768 ? 'light' : 'dark',
    reducedMotion: width === 390 ? 'reduce' : 'no-preference',
  });
  await page.goto('http://127.0.0.1:5360/tests/fixtures/catalog-lab.html');
  await page.locator('#open-catalog').click();
  await page.screenshot({ path: `${directory}/2026-10-03-catalog-${width}.png` });
  await page.locator('#catalog-overview').click();
  await expect(page.locator('#catalog-visible-count')).toHaveAttribute('data-count', '300');
  await page.screenshot({ path: `${directory}/2026-10-03-atlas-${width}.png` });
  await page.mouse.move(width / 2, 450);
  await page.mouse.wheel(0, 5000);
  await expect(page.locator('#catalog-visible-count')).toHaveAttribute('data-count', '0');
  await page.screenshot({ path: `${directory}/2026-10-03-cosmos-far-${width}.png` });
  await page.locator('#open-catalog').click();
  await page.locator('[data-catalog-id="M51"]').click();
  await page.mouse.move(width / 2, 450);
  await page.mouse.wheel(0, -1350);
  await expect
    .poll(async () => Number(await page.locator('canvas#universe').getAttribute('data-view-distance')), {
      timeout: 20000,
    })
    .toBeLessThan(40);
  await page.screenshot({ path: `${directory}/2026-10-03-flight-${width}.png` });
  await page.close();
}
await browser.close();
console.log('Synthetic catalog/atlas/flight evidence saved at 1440/768/390; no user data or Auth access.');
