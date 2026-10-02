import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const output = new URL('../docs/handoff/evidence/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  for (const colorScheme of ['dark', 'light']) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5350/');
      await page.locator('#star-count').waitFor();
      await page.screenshot({
        path: new URL(`2026-10-02-${width}-${colorScheme}-${reducedMotion}.png`, output).pathname.slice(1),
      });
      await context.close();
    }
  }
}
await browser.close();
