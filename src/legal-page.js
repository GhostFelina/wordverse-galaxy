import { LOCALES, localePath } from './i18n.js';

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
export const legalPath = (locale, kind) => `${locale === 'tr' ? '' : `/${locale}`}/${kind}`;

export function renderLegalPage(locale, kind) {
  const copy = LOCALES[locale].legal;
  const title = copy[kind];
  const canonical = `https://wordverse-galaxy.vercel.app${legalPath(locale, kind)}`;
  const alternatives = ['tr', 'en', 'es']
    .map(
      (code) =>
        `<link rel="alternate" hreflang="${code}" href="https://wordverse-galaxy.vercel.app${legalPath(code, kind)}">`,
    )
    .join('');
  const sections = copy[`${kind}Sections`]
    .map(([heading, body]) => `<section><h2>${escape(heading)}</h2><p>${escape(body)}</p></section>`)
    .join('');
  return `<!doctype html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#02040a"><meta name="description" content="${escape(copy[`${kind}Lead`])}"><title>${escape(title)} | Wordverse</title><link rel="icon" href="/favicon.svg"><link rel="canonical" href="${canonical}">${alternatives}<link rel="alternate" hreflang="x-default" href="https://wordverse-galaxy.vercel.app${legalPath('tr', kind)}"><meta property="og:title" content="${escape(title)} | Wordverse"><meta property="og:description" content="${escape(copy[`${kind}Lead`])}"><meta property="og:url" content="${canonical}"><style>
  *{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 80% 0,#182947,#02040a 55%);color:#e6eeff;font:16px/1.8 system-ui;min-height:100vh}main{max-width:800px;margin:auto;padding:35px 24px 80px}header,nav{display:flex;align-items:center;gap:16px;flex-wrap:wrap}header{justify-content:space-between;margin-bottom:65px}a{color:#c0d7ff;text-underline-offset:4px}h1{font:400 clamp(40px,8vw,66px)/1.15 Georgia,serif;margin:20px 0}h2{font:400 28px/1.3 Georgia,serif;margin:40px 0 10px}p{color:#adbedb}.updated{font-size:12px}.languages a{font-size:12px}.languages a[aria-current]{color:#fff;font-weight:bold}footer{border-top:1px solid #344a6d;margin-top:45px;padding-top:22px}a:focus-visible{outline:2px solid #c0d7ff;outline-offset:4px}
  </style></head><body><main><header><strong>wordverse ✦</strong><a href="${localePath(locale)}">${escape(copy.back)} ↗</a></header><nav class="languages" aria-label="${escape(copy.language)}">${['tr', 'en', 'es'].map((code) => `<a href="${legalPath(code, kind)}" hreflang="${code}"${locale === code ? ' aria-current="page"' : ''}>${code.toUpperCase()}</a>`).join('')}</nav><h1>${escape(title)}</h1><p>${escape(copy[`${kind}Lead`])}</p><p class="updated">${escape(copy.updated)}</p>${sections}<footer><nav><a href="${legalPath(locale, 'privacy')}">${escape(copy.privacy)}</a><a href="${legalPath(locale, 'terms')}">${escape(copy.terms)}</a><a href="mailto:kopukfad@gmail.com">${escape(copy.contact)}</a></nav></footer></main></body></html>`;
}
