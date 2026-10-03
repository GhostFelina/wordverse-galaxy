import { translate, formatNumber } from './i18n.js';
import { galaxies, drawCatalogPreview } from './catalog-layer.js';
import './catalog.css';

export function mountCatalogUI({ locale, beforeOpen, onFocus, onHome }) {
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
    focus.addEventListener('click', () => {
      dialog.close();
      onFocus(record);
      badge.hidden = false;
      badgeText.textContent = `${name} · ${record.id} — ${t('artistic')}`;
    });
    const source = node('a', t('source'));
    source.href = record.source;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    actions.append(focus, source);
    card.append(canvas, heading, meta, description, actions);
    grid.append(card);
  }
  dialog.append(close, title, node('p', t('intro'), 'catalog-intro'), grid);
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
  badge.append(badgeText, home);
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
  return { close: () => dialog.close() };
}
