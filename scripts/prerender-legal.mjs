import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { renderLegalPage } = await vite.ssrLoadModule('/src/legal-page.js');
  for (const locale of ['tr', 'en', 'es'])
    for (const kind of ['privacy', 'terms']) {
      const directory = new URL(`../dist/${locale === 'tr' ? '' : `${locale}/`}${kind}/`, import.meta.url);
      await mkdir(directory, { recursive: true });
      await writeFile(fileURLToPath(new URL('index.html', directory)), renderLegalPage(locale, kind), 'utf8');
    }
} finally {
  await vite.close();
}
