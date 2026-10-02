import { chromium } from '@playwright/test';

const browser = await chromium.launch();
for (const locale of ['tr', 'en', 'es']) {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:5360/about.html?lang=${locale}`);
    await page.locator('html').waitFor();
    await page.screenshot({
      path: new URL(`../docs/handoff/evidence/2026-10-02-about-${locale}-${width}.png`, import.meta.url).pathname.slice(
        1,
      ),
    });
    await context.close();
  }
}
await browser.close();
