import { translate, formatNumber } from './i18n.js';
import { galaxies, catalogRecords, drawCatalogPreview } from './catalog-layer.js';
import './catalog.css';

export function mountCatalogUI({ locale, beforeOpen, onFocus, onHome, onOverview }) {
  const t = (key, params) => translate(locale, `catalog.${key}`, params);
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const button = node('button', '✧', 'catalog-open');
  button.id = 'open-catalog';
  button.type = 'button';
  button.title = t('title');
  button.setAttribute('aria-label', t('title'));
  document.querySelector('.controls').append(button);
  const dialog = node('dialog', '', 'auth-dialog catalog-dialog');
  dialog.id = 'catalog-dialog';
  dialog.setAttribute('aria-labelledby', 'catalog-title');
  const close = node('button', '×', 'auth-close');
  close.type = 'button';
  close.setAttribute('aria-label', t('close'));
  close.addEventListener('click', () => dialog.close());
  const title = node('h2', t('title'));
  title.id = 'catalog-title';
  const grid = node('div', '', 'catalog-grid');
  function focusRecord(record, options) {
    dialog.close();
    onFocus(record, options);
    badge.hidden = false;
    const name = record.nameKey ? t(`names.${record.nameKey}`) : record.id;
    badgeText.textContent = `${name} · ${record.id} — ${t('artistic')}`;
  }
  for (const record of galaxies) {
    const card = node('article', '', 'catalog-card');
    const name = t(`names.${record.nameKey}`);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 240;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${name} · ${t('artistic')}`);
    drawCatalogPreview(canvas, record);
    const heading = node('h3', name);
    const meta = node(
      'p',
      `${record.id} · ${t('distance', { count: formatNumber(locale, record.distanceMly) })}`,
      'catalog-meta',
    );
    const description = node('p', t(`descriptions.${record.nameKey}`));
    const actions = node('div', '', 'catalog-actions');
    const focus = node('button', t('explore'), 'catalog-focus');
    focus.type = 'button';
    focus.dataset.catalogId = record.id;
    focus.setAttribute('aria-label', `${t('explore')} · ${name}`);
    focus.addEventListener('click', () => focusRecord(record));
    const source = node('a', t('source'));
    source.href = record.source;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    actions.append(focus, source);
    card.append(canvas, heading, meta, description, actions);
    grid.append(card);
  }
  const overview = node(
    'button',
    t('overview', { count: formatNumber(locale, catalogRecords.length) }),
    'catalog-focus',
  );
  overview.id = 'catalog-overview';
  overview.type = 'button';
  overview.addEventListener('click', () => {
    dialog.close();
    onOverview();
    badge.hidden = false;
    badgeText.textContent = t('overview', { count: formatNumber(locale, catalogRecords.length) });
  });
  const search = node('input', '');
  search.id = 'catalog-search';
  search.type = 'search';
  search.placeholder = t('search');
  search.setAttribute('aria-label', t('search'));
  const results = node('ul', '', 'catalog-results');
  const renderResults = () => {
    const query = search.value.trim().toUpperCase().replace(/\s+/g, '');
    results.replaceChildren();
    if (!query) return;
    for (const record of catalogRecords
      .filter((record) => [record.id, record.messier, record.catalogId].some((id) => id?.toUpperCase().includes(query)))
      .slice(0, 12)) {
      const row = node('li', '');
      const focus = node('button', `${record.id} · ${record.hubbleType}`, 'catalog-focus');
      focus.type = 'button';
      focus.dataset.catalogId = record.id;
      focus.addEventListener('click', () => focusRecord(record));
      const meta = node('span', `RA ${record.raDeg.toFixed(3)}° · Dec ${record.decDeg.toFixed(3)}° · J2000`);
      const source = node('a', 'OpenNGC');
      source.href = record.source;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      row.append(focus, meta, source);
      results.append(row);
    }
    if (!results.children.length) results.append(node('li', t('noResults')));
  };
  search.addEventListener('input', renderResults);
  const credit = node('a', t('credit'), 'catalog-credit');
  credit.href = 'https://github.com/mattiaverga/OpenNGC';
  credit.target = '_blank';
  credit.rel = 'noopener noreferrer';
  dialog.append(close, title, node('p', t('intro'), 'catalog-intro'), overview, search, results, credit, grid);
  const badge = node('aside', '', 'catalog-badge');
  badge.id = 'catalog-view';
  badge.hidden = true;
  const badgeText = node('span', '');
  const home = node('button', t('home'));
  home.type = 'button';
  home.addEventListener('click', () => {
    badge.hidden = true;
    onHome();
  });
  const visibleCount = node('span', '', 'catalog-count');
  visibleCount.id = 'catalog-visible-count';
  badge.append(badgeText, visibleCount, home);
  document.body.append(dialog, badge);
  button.addEventListener('click', () => {
    beforeOpen();
    dialog.showModal();
  });
  for (const id of ['home-btn', 'reset-view', 'galaxy-switch']) {
    document.getElementById(id)?.addEventListener('click', () => {
      badge.hidden = true;
      document.getElementById('app').classList.remove('catalog-exploring');
    });
  }
  let lastCount = -1;
  return {
    focus: focusRecord,
    close: () => dialog.close(),
    setVisibleCount(count) {
      if (lastCount === count) return;
      lastCount = count;
      visibleCount.textContent = count ? t('visible', { count: formatNumber(locale, count) }) : '';
      visibleCount.dataset.count = String(count);
    },
  };
}
