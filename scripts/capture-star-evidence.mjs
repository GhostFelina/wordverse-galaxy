import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const directory = 'docs/handoff/evidence';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    reducedMotion: width === 390 ? 'reduce' : 'no-preference',
  });
  await page.goto('http://127.0.0.1:5360/tests/fixtures/star-cosmos-lab.html');
  await expect(page.locator('canvas')).toHaveAttribute('data-scene-mode', 'stars-only');
  await expect
    .poll(async () => Number(await page.locator('canvas').getAttribute('data-camera-z')))
    .toBeGreaterThan(100);
  await page.screenshot({ path: `${directory}/2026-10-03-stars-${width}.png` });
  await page.mouse.move(width / 2, 450);
  await page.mouse.wheel(0, -1100);
  await expect.poll(async () => Number(await page.locator('canvas').getAttribute('data-camera-z'))).toBeLessThan(35);
  await page.screenshot({ path: `${directory}/2026-10-03-stars-near-${width}.png` });
  await page.mouse.wheel(0, 10000);
  await expect
    .poll(async () => Number(await page.locator('canvas').getAttribute('data-camera-z')))
    .toBeGreaterThan(45000);
  await page.screenshot({ path: `${directory}/2026-10-03-stars-far-${width}.png` });
  await page.close();
}
await browser.close();
console.log('Stars-only evidence saved at 1440/768/390, without Auth or user storage access.');
