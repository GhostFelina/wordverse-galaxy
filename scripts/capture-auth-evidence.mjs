import { chromium, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch();
try {
  for (const locale of ['tr', 'en', 'es'])
    for (const width of [1440, 768, 390]) {
      for (const colorScheme of ['light', 'dark'])
        for (const reducedMotion of ['reduce', 'no-preference']) {
          const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion });
          const page = await context.newPage();
          await page.goto(`http://127.0.0.1:5360/?lang=${locale}`);
          await page.locator('#open-account').click();
          await expect(page.locator('#account-dialog')).toBeVisible();
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
          if (overflow) throw new Error(`Horizontal overflow: ${locale}/${width}`);
          await page.screenshot({
            path: fileURLToPath(
              new URL(
                `../docs/handoff/evidence/2026-10-03-auth-${locale}-${width}-${colorScheme}-${reducedMotion}.png`,
                import.meta.url,
              ),
            ),
          });
          await context.close();
        }
    }
} finally {
  await browser.close();
}
