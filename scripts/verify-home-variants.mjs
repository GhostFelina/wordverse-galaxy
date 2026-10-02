import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const issues = [];
for (const locale of ['tr', 'en', 'es']) {
  for (const width of [1440, 768, 390]) {
    for (const colorScheme of ['dark', 'light']) {
      for (const reducedMotion of ['no-preference', 'reduce']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion });
        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:5360/?lang=${locale}`);
        const metrics = await page.evaluate(() => {
          const hero = document.querySelector('.hero').getBoundingClientRect();
          const picker = document.querySelector('#ui-language').getBoundingClientRect();
          const stats = document.querySelector('.bottom-left').getBoundingClientRect();
          const controls = document.querySelector('.controls').getBoundingClientRect();
          return {
            scrollWidth: document.documentElement.scrollWidth,
            heroRight: hero.right,
            pickerRight: picker.right,
            statRight: stats.right,
            controlsLeft: controls.left,
            selectedLocale: document.querySelector('#ui-language').value,
          };
        });
        if (
          metrics.scrollWidth > width ||
          metrics.heroRight > width + 1 ||
          metrics.pickerRight > width + 1 ||
          metrics.statRight > metrics.controlsLeft - 12 ||
          metrics.selectedLocale !== locale
        ) {
          issues.push({ locale, width, colorScheme, reducedMotion, metrics });
        }
        if (colorScheme === 'light' && reducedMotion === 'reduce') {
          await page.screenshot({
            path: new URL(
              `../docs/handoff/evidence/2026-10-02-variant-${locale}-${width}-light-reduce.png`,
              import.meta.url,
            ).pathname.slice(1),
          });
        }
        await context.close();
      }
    }
  }
}
await browser.close();
if (issues.length) {
  process.stderr.write(`${JSON.stringify(issues, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('36 locale / viewport / theme / motion combinations passed.\n');
}
