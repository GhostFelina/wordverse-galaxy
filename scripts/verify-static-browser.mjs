import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
for (const [locale, homeTitle, aboutTitle] of [
  ['tr', 'Her kelime,', 'Nasıl çalışır?'],
  ['en', 'Every word,', 'How does it work?'],
  ['es', 'Cada palabra,', '¿Cómo funciona?'],
]) {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  for (const [pageKind, path, heading] of [
    ['home', locale === 'tr' ? '/' : `/${locale}/`, homeTitle],
    ['about', locale === 'tr' ? '/about.html' : `/${locale}/about.html`, aboutTitle],
  ]) {
    const response = await page.goto(`http://127.0.0.1:5361${path}`);
    assert.equal(response.status(), 200, path);
    assert.equal(await page.locator('html').getAttribute('lang'), locale, path);
    assert.ok((await page.locator(pageKind === 'home' ? 'h1' : '#how').textContent()).includes(heading), path);
    assert.equal(await page.locator('link[rel="alternate"][hreflang]').count(), 4, path);
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute('href'),
      `https://wordverse-galaxy.vercel.app${path}`,
      path,
    );
    await page.screenshot({
      path: new URL(
        `../docs/handoff/evidence/2026-10-02-static-${locale}-${pageKind}.png`,
        import.meta.url,
      ).pathname.slice(1),
    });
  }
  await context.close();
  const interactive = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: `${locale}-${{ tr: 'TR', en: 'US', es: 'ES' }[locale]}`,
  });
  const livePage = await interactive.newPage();
  const errors = [];
  livePage.on('pageerror', (error) => errors.push(error.message));
  for (const [path, heading, selector] of [
    [locale === 'tr' ? '/' : `/${locale}/`, homeTitle, 'h1'],
    [locale === 'tr' ? '/about.html' : `/${locale}/about.html`, aboutTitle, '#how'],
  ]) {
    const response = await livePage.goto(`http://127.0.0.1:5361${path}`);
    assert.equal(response.status(), 200, path);
    await livePage.waitForTimeout(500);
    const actualHeading = await livePage.locator(selector).textContent();
    assert.ok(actualHeading.includes(heading), `${path}: ${actualHeading}`);
    assert.equal(await livePage.locator('#ui-language').inputValue(), locale, path);
  }
  assert.deepEqual(errors, [], locale);
  await interactive.close();
}
await browser.close();
process.stdout.write('Six production-preview pages passed with JavaScript on and off.\n');
