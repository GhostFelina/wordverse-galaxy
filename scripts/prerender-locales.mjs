import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseHTML } from 'linkedom';
import { createServer } from 'vite';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputRoot = join(projectRoot, 'dist');
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { applyHomeTranslations } = await vite.ssrLoadModule('/src/home-i18n.js');
  const { applyAboutTranslations } = await vite.ssrLoadModule('/src/about.js');
  const templates = {
    home: await readFile(join(outputRoot, 'index.html'), 'utf8'),
    about: await readFile(join(outputRoot, 'about.html'), 'utf8'),
  };
  for (const locale of ['tr', 'en', 'es']) {
    const directory = locale === 'tr' ? outputRoot : join(outputRoot, locale);
    await mkdir(directory, { recursive: true });
    for (const [page, html] of Object.entries(templates)) {
      const { document, Node } = parseHTML(html);
      globalThis.document = document;
      globalThis.Node = Node;
      if (page === 'home') applyHomeTranslations(locale);
      else applyAboutTranslations(locale);
      await writeFile(join(directory, page === 'home' ? 'index.html' : 'about.html'), document.toString(), 'utf8');
    }
  }
} finally {
  delete globalThis.document;
  delete globalThis.Node;
  await vite.close();
}
