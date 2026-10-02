import { chromium } from '@playwright/test';

const browser = await chromium.launch();
for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5360/');
  await page.locator('#galaxy-switch').click();
  await page.locator('#meaning-language-current').selectOption('es');
  await page.waitForTimeout(650);
  await page.screenshot({
    path: new URL(`../docs/handoff/evidence/2026-10-02-phase1-meaning-${width}.png`, import.meta.url).pathname.slice(1),
  });
  await context.close();
}
await browser.close();
