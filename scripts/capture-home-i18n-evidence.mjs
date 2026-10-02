import { chromium } from '@playwright/test';

const browser = await chromium.launch();
for (const locale of ['tr', 'en', 'es']) {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:5360/?lang=${locale}`);
    for (const [panel, open, close] of [
      ['home', null, null],
      ['add', '#open-add', '#close-add'],
      ['collection', null, '#close-collection'],
      ['galaxy', '#galaxy-switch', '#close-galaxy'],
    ]) {
      if (panel === 'collection') await page.keyboard.press('/');
      else if (open) await page.locator(open).click();
      if (panel !== 'home')
        await page.locator(`#${panel === 'add' ? 'add' : panel}-panel`).waitFor({ state: 'visible' });
      if (panel !== 'home') await page.waitForTimeout(500);
      await page.screenshot({
        path: new URL(
          `../docs/handoff/evidence/2026-10-02-home-${locale}-${width}-${panel}.png`,
          import.meta.url,
        ).pathname.slice(1),
      });
      if (close) await page.locator(close).click();
    }
    await context.close();
  }
}
await browser.close();
