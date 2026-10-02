import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const origin = 'https://wordverse-galaxy.vercel.app';
for (const locale of ['tr', 'en', 'es']) {
  const copy = JSON.parse(await readFile(join(root, 'locales', `${locale}.json`), 'utf8'));
  const directory = locale === 'tr' ? join(root, 'dist') : join(root, 'dist', locale);
  for (const page of ['home', 'about']) {
    const file = join(directory, page === 'home' ? 'index.html' : 'about.html');
    const { document } = parseHTML(await readFile(file, 'utf8'));
    const path = `${locale === 'tr' ? '' : `/${locale}`}${page === 'home' ? '/' : '/about.html'}`;
    const expected = page === 'home' ? copy.home : copy.about;
    assert.equal(document.documentElement.lang, locale, file);
    assert.equal(document.title, expected.title, file);
    assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), `${origin}${path}`, file);
    assert.equal(
      document.querySelector('meta[name="description"]').getAttribute('content'),
      expected.metaDescription,
      file,
    );
    assert.equal(document.querySelector('meta[property="og:title"]').getAttribute('content'), expected.ogTitle, file);
    assert.equal(
      document.querySelector('meta[property="og:description"]').getAttribute('content'),
      expected.ogDescription,
      file,
    );
    assert.equal(document.querySelectorAll('link[rel="alternate"][hreflang]').length, 4, file);
    assert.equal(document.querySelector('#ui-language option[selected]').getAttribute('value'), locale, file);
    const schema = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal(schema.inLanguage ?? locale, locale, file);
    if (page === 'home') {
      assert.equal(document.querySelector('.hero h1').textContent, copy.hero.titleFirst + copy.hero.titleSecond, file);
      assert.equal(document.querySelector('#star-count').textContent, '00', file);
      assert.equal(document.querySelector('#galaxy-count').textContent, '02', file);
      assert.equal(schema.description, expected.schemaDescription, file);
    } else {
      assert.equal(document.querySelector('h1').textContent, expected.heroFirst + expected.heroSecond, file);
      assert.equal(schema.mainEntity.length, 4, file);
      assert.equal(schema.mainEntity[0].name, expected.faq[0].question, file);
    }
  }
}
process.stdout.write('Six static locale pages verified.\n');
