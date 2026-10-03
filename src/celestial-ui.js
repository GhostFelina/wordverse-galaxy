import { translate, formatNumber } from './i18n.js';
import './catalog.css';

export function mountCelestialUI({ locale, groups, beforeOpen, onFocus, onOverview, onHome }) {
  const t = (key, params) => translate(locale, `celestial.${key}`, params);
  const node = (tag, text = '', className = '') => {
    const e = document.createElement(tag);
    e.textContent = text;
    e.className = className;
    return e;
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
  const title = node('h2', t('title'));
  title.id = 'catalog-title';
  const close = node('button', '×', 'auth-close');
  close.type = 'button';
  close.setAttribute('aria-label', t('close'));
  close.addEventListener('click', () => dialog.close());
  const tabs = node('div', '', 'celestial-tabs');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', t('types'));
  const count = node('p', '', 'celestial-summary');
  count.id = 'celestial-count';
  const search = node('input');
  search.id = 'catalog-search';
  search.type = 'search';
  search.placeholder = t('search');
  search.setAttribute('aria-label', t('search'));
  const results = node('ul', '', 'catalog-results celestial-results');
  const pages = node('div', '', 'celestial-pages');
  const prev = node('button', t('previous'), 'catalog-focus'),
    next = node('button', t('next'), 'catalog-focus');
  prev.type = next.type = 'button';
  const pageLabel = node('span');
  pages.append(prev, pageLabel, next);
  const overview = node('button', t('overview'), 'catalog-focus');
  overview.id = 'catalog-overview';
  overview.type = 'button';
  overview.hidden = !groups.galaxies;
  const credit = node('p', t('credit'), 'catalog-intro');
  let active = Object.keys(groups)[0],
    page = 0;
  const unknown = t('unknown');
  const number = (value, digits = 2) =>
    value === null || value === undefined
      ? unknown
      : new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  function describe(type, r) {
    if (type === 'galaxies' || type === 'nebulae')
      return `${r.messier ? `${r.messier} · ` : ''}${r.hubbleType || t(`kinds.${r.kind}`)} · RA ${number(r.raDeg, 3)}° · Dec ${number(r.decDeg, 3)}° · J2000`;
    if (type === 'asteroids')
      return `${t('diameter')}: ${number(r.diameterKm)} km · a ${number(r.semimajorAxisAu, 3)} AU · ${t('epoch')}: JD ${r.epochJdTdb}`;
    return `${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(r.dateUtc))} UTC · ${number(r.impactEnergyKt, 3)} kt · ${t('location')}: ${number(r.latitudeDeg)}°, ${number(r.longitudeDeg)}° · ${t('altitude')}: ${number(r.altitudeKm)} km`;
  }
  const badge = node('aside', '', 'catalog-badge');
  badge.id = 'catalog-view';
  badge.hidden = true;
  const badgeText = node('span');
  const home = node('button', t('home'));
  home.type = 'button';
  badge.append(badgeText, home);
  function focus(type, r) {
    dialog.close();
    badge.hidden = false;
    badgeText.textContent = `${r.name || r.messier || r.id} — ${t(type === 'fireballs' ? 'replay' : 'artistic')}${type === 'fireballs' && (r.latitudeDeg === null || r.longitudeDeg === null) ? ` · ${t('noLocation')}` : ''}`;
    onFocus(type, r);
  }
  function render() {
    for (const tab of tabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.catalogType === active));
    const query = search.value.trim().toLocaleLowerCase(locale).replace(/\s+/g, '');
    const filtered = groups[active].filter((r) =>
      [r.id, r.name, r.fullName, r.messier, r.catalogId, r.dateUtc, r.designation].some((v) =>
        v?.toLocaleLowerCase(locale).replace(/\s+/g, '').includes(query),
      ),
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
    page = Math.min(page, totalPages - 1);
    count.textContent = t('count', { count: formatNumber(locale, groups[active].length), type: t(active) });
    count.dataset.count = String(groups[active].length);
    count.dataset.type = active;
    results.replaceChildren();
    for (const r of filtered.slice(page * 12, (page + 1) * 12)) {
      const row = node('li');
      const action = node(
        'button',
        r.name ? `${r.designation} ${r.name}` : r.messier ? `${r.id} · ${r.messier}` : r.id,
        'catalog-focus',
      );
      action.type = 'button';
      action.dataset.catalogId = r.id;
      action.addEventListener('click', () => focus(active, r));
      const meta = node('span', describe(active, r), 'celestial-meta');
      const source = node('a', t('source'));
      source.href = r.source;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      row.append(action, meta, source);
      results.append(row);
    }
    if (!filtered.length) results.append(node('li', t('noResults')));
    prev.disabled = page === 0;
    next.disabled = page === totalPages - 1;
    pageLabel.textContent = `${page + 1} / ${totalPages}`;
  }
  for (const type of Object.keys(groups)) {
    const tab = node('button', `${t(type)} · ${formatNumber(locale, groups[type].length)}`, 'catalog-focus');
    tab.type = 'button';
    tab.dataset.catalogType = type;
    tab.addEventListener('click', () => {
      active = type;
      page = 0;
      search.value = '';
      render();
    });
    tabs.append(tab);
  }
  search.addEventListener('input', () => {
    page = 0;
    render();
  });
  prev.addEventListener('click', () => {
    page--;
    render();
  });
  next.addEventListener('click', () => {
    page++;
    render();
  });
  home.addEventListener('click', () => {
    badge.hidden = true;
    onHome();
  });
  overview.addEventListener('click', () => {
    dialog.close();
    badge.hidden = false;
    badgeText.textContent = t('overview');
    onOverview();
  });
  dialog.append(
    close,
    title,
    node('p', t('intro'), 'catalog-intro'),
    tabs,
    count,
    overview,
    search,
    results,
    pages,
    credit,
  );
  document.body.append(dialog, badge);
  render();
  button.addEventListener('click', () => {
    beforeOpen();
    dialog.showModal();
  });
  return {
    home() {
      badge.hidden = true;
    },
    dispose() {
      button.remove();
      dialog.remove();
      badge.remove();
    },
  };
}
