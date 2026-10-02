import { chromium } from '@playwright/test';

const browser = await chromium.launch();
for (const locale of ['en', 'es']) {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:5360/?lang=${locale}`);
  const strings = await page.evaluate(() => {
    const found = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.parentElement?.closest('script,style')) continue;
      const value = walker.currentNode.textContent.trim();
      if (value) found.add(value);
    }
    for (const element of document.querySelectorAll('[aria-label],[placeholder],[title]')) {
      for (const attribute of ['aria-label', 'placeholder', 'title']) {
        const value = element.getAttribute(attribute);
        if (value) found.add(value);
      }
    }
    return [...found].filter((value) =>
      /[İıĞğŞşÇçÖöÜü]|yıldız|galaksi|kelime|anlam|evren|kayıt|gezegen|gün/i.test(value),
    );
  });
  process.stdout.write(`${locale}: ${JSON.stringify(strings, null, 2)}\n`);
  await page.close();
}
await browser.close();
