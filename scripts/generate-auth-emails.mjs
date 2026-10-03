import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const escape = (value) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function renderEmail(copy, type, locale, url = '{{ .ConfirmationURL }}') {
  const message = copy[type];
  if (!message) throw new Error('Unknown email type');
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wordverse · ${escape(message.title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#070d1b;color:#eaf0ff;font-family:Arial,sans-serif">
<table role="presentation" style="max-width:560px;width:100%;margin:auto;background:#101a2d;border:1px solid #354968;border-radius:12px"><tr><td style="padding:32px 24px">
<p style="color:#b8ceff;letter-spacing:2px;font-size:14px">✦ WORDVERSE</p>
<h1 style="font-size:28px;line-height:1.2">${escape(message.title)}</h1>
<p style="line-height:1.7">${escape(message.body)}</p>
<p style="margin:28px 0"><a href="${url}" style="display:inline-block;padding:15px 20px;background:#c4d5ff;color:#101a2d;border-radius:6px;font-weight:bold;text-decoration:none">${escape(message.action)}</a></p>
<p style="line-height:1.6">${escape(copy.ignore)}</p><p style="line-height:1.6;color:#c6d2e9">${escape(copy.private)}</p>
<p style="font-size:12px;line-height:1.6">${escape(copy.fallback)}<br><a href="${url}" style="color:#b8ceff;overflow-wrap:anywhere;word-break:break-all">${url}</a></p>
<hr style="border:0;border-top:1px solid #354968"><p style="font-size:12px;color:#c6d2e9">${escape(copy.footer)}</p>
</td></tr></table></body></html>
`;
}

export async function generateEmails() {
  const copy = {};
  for (const locale of ['tr', 'en', 'es'])
    copy[locale] = JSON.parse(await readFile(resolve(root, `locales/${locale}.json`), 'utf8')).email;
  await mkdir(resolve(root, 'supabase/templates'), { recursive: true });
  await mkdir(resolve(root, 'tests/fixtures/emails'), { recursive: true });
  for (const type of ['confirmation', 'recovery']) {
    const branches = ['en', 'es', 'tr']
      .map(
        (locale, index) =>
          `${index === 0 ? '{{ $locale := "" }}{{ with .Data }}{{ $locale = printf "%v" .ui_locale }}{{ end }}{{ if eq $locale "en" }}' : index === 1 ? '{{ else if eq $locale "es" }}' : '{{ else }}'}\n${renderEmail(copy[locale], type, locale)}`,
      )
      .join('');
    await writeFile(resolve(root, `supabase/templates/${type}.html`), `${branches}{{ end }}\n`);
    for (const locale of ['tr', 'en', 'es'])
      await writeFile(
        resolve(root, `tests/fixtures/emails/${type}-${locale}.html`),
        renderEmail(copy[locale], type, locale, 'https://example.test/auth/verify'),
      );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await generateEmails();
