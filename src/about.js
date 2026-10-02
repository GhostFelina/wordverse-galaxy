import { LOCALE_KEY, normalizeLocale, resolveLocale, translate } from './i18n.js';

const explicitLocale = normalizeLocale(new URLSearchParams(location.search).get('lang'));
const locale = explicitLocale || resolveLocale({ storage: localStorage, browserLanguage: navigator.language });
if (explicitLocale) {
  try {
    localStorage.setItem(LOCALE_KEY, explicitLocale);
  } catch {
    /* Reading still works when storage is disabled. */
  }
}

const t = (key) => translate(locale, `about.${key}`);
const setText = (selector, key) => {
  document.querySelector(selector).textContent = t(key);
};
document.documentElement.lang = locale;
document.title = t('title');
setText('header a', 'back');
setText('.eyebrow', 'eyebrow');
const title = document.querySelector('h1');
const secondLine = document.createElement('em');
secondLine.textContent = t('heroSecond');
title.replaceChildren(t('heroFirst'), document.createElement('br'), secondLine);
setText('.lead', 'lead');
setText('.button', 'cta');
setText('#how', 'howTitle');
document.querySelectorAll('section[aria-labelledby="how"] .card').forEach((card, index) => {
  card.querySelector('strong').textContent = t(`steps.${index}.title`);
  card.querySelector('p').textContent = t(`steps.${index}.body`);
});
setText('#questions', 'faqTitle');
document.querySelectorAll('section[aria-labelledby="questions"] .faq').forEach((item, index) => {
  item.querySelector('h3').textContent = t(`faq.${index}.question`);
  item.querySelector('p').textContent = t(`faq.${index}.answer`);
});
setText('#planets', 'planetsTitle');
const planetText = document.querySelector('section[aria-labelledby="planets"] p');
const [textures, terms] = planetText.querySelectorAll('a');
textures.textContent = t('textureSource');
terms.textContent = t('imageTerms');
planetText.replaceChildren(`${t('planetsBody')} `, textures, ' · ', terms, `. ${t('courtesy')}`);
setText('.note', 'note');
document.querySelectorAll('header a, .button').forEach((link) => {
  link.href = `/?lang=${locale}`;
});

document.querySelector('meta[name="description"]').content = t('metaDescription');
document.querySelector('meta[property="og:title"]').content = t('ogTitle');
document.querySelector('meta[property="og:description"]').content = t('ogDescription');
const imageAlt = document.querySelector('meta[property="og:image:alt"]');
if (imageAlt) imageAlt.content = t('ogImageAlt');
document.querySelector('meta[property="og:locale"]')?.remove();
const ogLocale = document.createElement('meta');
ogLocale.setAttribute('property', 'og:locale');
ogLocale.content = { tr: 'tr_TR', en: 'en_US', es: 'es_ES' }[locale];
document.head.append(ogLocale);
const canonical = `https://wordverse-galaxy.vercel.app/about.html?lang=${locale}`;
document.querySelector('link[rel="canonical"]').href = canonical;
document.querySelector('meta[property="og:url"]').content = canonical;
for (const code of ['tr', 'en', 'es']) {
  const alternate = document.createElement('link');
  alternate.rel = 'alternate';
  alternate.hreflang = code;
  alternate.href = `https://wordverse-galaxy.vercel.app/about.html?lang=${code}`;
  document.head.append(alternate);
}
const fallback = document.createElement('link');
fallback.rel = 'alternate';
fallback.hreflang = 'x-default';
fallback.href = 'https://wordverse-galaxy.vercel.app/about.html?lang=tr';
document.head.append(fallback);
document.querySelector('script[type="application/ld+json"]').textContent = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [0, 1, 2, 3].map((index) => ({
    '@type': 'Question',
    name: t(`faq.${index}.question`),
    acceptedAnswer: { '@type': 'Answer', text: t(`faq.${index}.answer`) },
  })),
});
