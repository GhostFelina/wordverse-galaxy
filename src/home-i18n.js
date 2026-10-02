import {
  LOCALE_KEY,
  formatUnit,
  localeFromPath,
  localePath,
  normalizeLocale,
  resolveLocale,
  translate,
} from './i18n.js';

export function getHomeLocale() {
  const pathLocale = localeFromPath(location.pathname);
  if (pathLocale) return pathLocale;
  const explicit = normalizeLocale(new URLSearchParams(location.search).get('lang'));
  if (explicit) {
    try {
      localStorage.setItem(LOCALE_KEY, explicit);
    } catch {
      /* A browser may disable local storage. */
    }
    return explicit;
  }
  return resolveLocale({ storage: localStorage, browserLanguage: navigator.language });
}

export function applyHomeTranslations(locale) {
  const t = (key, params) => translate(locale, key, params);
  const setText = (selector, key) => {
    document.querySelector(selector).textContent = t(key);
  };
  const setOwnText = (selector, key, index = 0) => {
    const node = [...document.querySelector(selector).childNodes].filter(
      (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
    )[index];
    const original = node.textContent;
    node.textContent = original.replace(original.trim(), t(key));
  };
  const setAria = (selector, key) => document.querySelector(selector).setAttribute('aria-label', t(key));
  document.documentElement.lang = locale;
  document.title = t('home.title');
  document.querySelector('meta[name="description"]').content = t('home.metaDescription');
  document.querySelector('meta[property="og:title"]').content = t('home.ogTitle');
  document.querySelector('meta[property="og:description"]').content = t('home.ogDescription');
  document.querySelector('meta[property="og:image:alt"]').content = t('home.ogImageAlt');
  document.querySelector('meta[name="twitter:title"]').content = t('home.ogTitle');
  document.querySelector('meta[name="twitter:description"]').content = t('home.ogDescription');
  document.querySelector('meta[property="og:locale"]').content = { tr: 'tr_TR', en: 'en_US', es: 'es_ES' }[locale];
  const canonical = `https://wordverse-galaxy.vercel.app${localePath(locale)}`;
  document.querySelector('link[rel="canonical"]').href = canonical;
  document.querySelector('meta[property="og:url"]').content = canonical;
  document.querySelector('script[type="application/ld+json"]').textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Wordverse',
    url: canonical,
    description: t('home.schemaDescription'),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: locale,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
    featureList: [t('home.feature1'), t('home.feature2'), t('home.feature3')],
  });
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => link.remove());
  for (const code of ['tr', 'en', 'es']) {
    const alternate = document.createElement('link');
    alternate.rel = 'alternate';
    alternate.hreflang = code;
    alternate.href = `https://wordverse-galaxy.vercel.app${localePath(code)}`;
    document.head.append(alternate);
  }
  const fallback = document.createElement('link');
  fallback.rel = 'alternate';
  fallback.hreflang = 'x-default';
  fallback.href = 'https://wordverse-galaxy.vercel.app/';
  document.head.append(fallback);
  setAria('#universe', 'home.universeCanvas');
  setAria('#universe-mode', 'home.universeOnly');
  setAria('#home-btn', 'home.homeButton');
  setAria('.topnav', 'home.mainMenu');
  setText('#explore-btn', 'nav.explore');
  setText('#collection-btn', 'nav.collection');
  setOwnText('.live-indicator', 'home.personalUniverse');
  document.querySelectorAll('#ui-language option').forEach((option) => {
    if (option.value === locale) option.setAttribute('selected', '');
    else option.removeAttribute('selected');
  });
  setAria('#ui-language', 'home.languagePicker');
  setAria('#galaxy-switch', 'home.galaxySwitch');
  setText('#active-galaxy-name', 'names.defaultGalaxy.english');
  setText('#open-add span:last-child', 'action.addWord');
  setOwnText('.hero .eyebrow', 'home.eyebrow');
  document.querySelector('.hero h1').replaceChildren(t('hero.titleFirst'), document.createElement('br'));
  const heroEm = document.createElement('em');
  heroEm.textContent = t('hero.titleSecond');
  document.querySelector('.hero h1').append(heroEm);
  document.querySelector('#hero-description').textContent = t('hero.empty', {
    galaxy: t('names.defaultGalaxy.english'),
  });
  setOwnText('#hero-add', 'action.addFirst');
  setOwnText('#hero-explore', 'home.exploreUniverse');
  setOwnText('#demo-note', 'home.demoNote');
  setText('.about-link', 'home.aboutLink');
  document.querySelector('.about-link').href = localePath(locale, 'about');
  setAria('#star-layer', 'home.starLayer');
  setText('.stat:has(#star-count) span', 'home.starStat');
  setText('.stat:has(#planet-count) span', 'home.planetStat');
  setText('.stat:has(#days-count) span', 'home.dayStat');
  setText('.stat:has(#galaxy-count) span', 'home.galaxyStat');
  document.querySelector('#star-count').textContent = '00';
  document.querySelector('#planet-count').textContent = '00';
  document.querySelector('#days-count').textContent = '00';
  document.querySelector('#galaxy-count').textContent = '02';
  setText('#bottom-caption', 'home.emptyCaption');
  setAria('.controls', 'home.controls');
  for (const [selector, key] of [
    ['#zoom-in', 'home.zoomIn'],
    ['#zoom-out', 'home.zoomOut'],
    ['#reset-view', 'home.resetView'],
  ]) {
    setAria(selector, key);
    document.querySelector(selector).title = t(key);
  }
  setOwnText('.interaction-hint', 'home.hoverHint');
  setOwnText('.interaction-hint', 'home.zoomHint', 1);

  for (const selector of ['#close-detail', '#close-add']) setAria(selector, 'panel.close');
  setText('#object-record-label', 'panel.recordStar');
  document.querySelector('#detail-language').textContent = t('panel.wordType', {
    language: t('names.language.en').toLocaleUpperCase(locale),
  });
  document.querySelector('#detail-meaning-language').textContent = t('panel.meaningOf', {
    language: t('names.language.tr').toLocaleUpperCase(locale),
  });
  setAria('#reveal-meaning', 'action.showMeaning');
  setText('#meaning-hidden', 'panel.hiddenMeaning');
  setText('#object-stage-label', 'panel.starStage');
  setText('#binary-label', 'panel.binaryLabel');
  setText('#example-wrap .field-label', 'panel.example');
  setOwnText('#focus-star', 'panel.focusStar');
  setText('#edit-word', 'panel.edit');
  setText('#delete-word', 'panel.removeStar');
  setOwnText('#add-panel .panel-kicker', 'panel.newLight');
  const formTitle = document.querySelector('#form-title');
  const formEm = document.createElement('em');
  formEm.textContent = t('panel.newStarSecond');
  formTitle.replaceChildren(t('panel.newStarFirst'), document.createElement('br'), formEm);
  setText('#form-copy', 'panel.newStarCopy');
  document.querySelector('#word-language-label').textContent = t('panel.wordType', {
    language: t('names.language.en').toLocaleUpperCase(locale),
  });
  document.querySelector('#form-meaning-language').textContent = t('panel.meaningOf', {
    language: t('names.language.tr').toLocaleUpperCase(locale),
  });
  setText('.entry-kind legend', 'panel.kind');
  const kinds = document.querySelectorAll('.entry-kind label');
  for (const [index, wordKey, kindKey] of [
    [0, 'panel.kindWord', 'panel.kindStar'],
    [1, 'panel.kindConjunction', 'panel.kindPlanet'],
  ]) {
    setOwnText(`.entry-kind label:nth-child(${index + 2}) span`, wordKey);
    kinds[index].querySelector('small').textContent = t(kindKey);
  }
  document.querySelector('#meaning-input').placeholder = t('panel.meaningPlaceholder');
  document.querySelector('#word-input').placeholder = t('panel.wordPlaceholder');
  document.querySelector('#example-input').placeholder = t('panel.examplePlaceholder');
  setOwnText('label[for="example-input"]', 'panel.example');
  setText('label[for="example-input"] small', 'panel.optional');
  setOwnText('#submit-word', 'panel.addStar');

  setOwnText('#collection-panel .panel-kicker', 'panel.atlas');
  setOwnText('#collection-title', 'panel.myWords');
  setText('#collection-panel .collection-top p', 'panel.collectionDescription');
  setAria('#close-collection', 'panel.closeCollection');
  document.querySelector('#search-input').placeholder = t('panel.searchPlaceholder');
  setAria('#search-input', 'panel.searchAria');
  document.querySelector('#result-count').textContent = formatUnit(locale, 'entry', 0, { uppercase: true });
  setText('.collection-meta span:last-child', 'panel.newestFirst');
  setOwnText('#collection-add', 'panel.addWord');

  setOwnText('#galaxy-panel .panel-kicker', 'panel.galaxyMap');
  setOwnText('#galaxy-panel-title', 'panel.myGalaxies');
  setText('#galaxy-panel .collection-top p', 'panel.galaxyDescription');
  setText('#galaxy-language', 'names.language.en');
  setText('#galaxy-name-detail', 'names.defaultGalaxy.english');
  setAria('#close-galaxy', 'panel.closeGalaxies');
  setAria('#rename-galaxy', 'panel.renameGalaxy');
  setAria('#rename-galaxy-input', 'panel.newGalaxyName');
  setText('#rename-galaxy-form button[type="submit"]', 'panel.save');
  setAria('#cancel-rename-galaxy', 'panel.cancel');
  setText('.meaning-language-label', 'panel.meaningLanguage');
  setText('#galaxy-form .field-label', 'panel.createGalaxy');
  setText('label[for="language-input"]', 'panel.learnLanguage');
  document.querySelector('#language-input').placeholder = t('panel.languagePlaceholder');
  setText('label[for="meaning-language-input"]', 'panel.meaningLanguage');
  setOwnText('label[for="galaxy-name-input"]', 'panel.galaxyName');
  setText('label[for="galaxy-name-input"] small', 'panel.optional');
  document.querySelector('#galaxy-name-input').placeholder = t('panel.galaxyPlaceholder');
  setOwnText('#galaxy-form .submit-button', 'panel.createGalaxyButton');
  setText('#export-universe', 'panel.export');
  setText('.import-universe', 'panel.import');
}
