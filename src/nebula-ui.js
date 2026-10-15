import { translate } from './i18n.js';
import './nebula.css';
import { NEBULA_EXPERIENCES, nebulaPreview, searchNebulae } from './nebula-experiences.js';

export function mountNebulaUI({ locale, records, beforeOpen, onFocus, onOverview, onExperience }) {
  const t = (key) => translate(locale, `nebulaTravel.${key}`);
  const node = (tag, text = '', className = '') => {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    return element;
  };
  const open = node('button', '✧', 'nebula-open');
  open.id = 'open-nebulae';
  open.type = 'button';
  open.title = t('title');
  open.setAttribute('aria-label', t('title'));
  document.querySelector('.controls').append(open);
  const dialog = node('dialog', '', 'auth-dialog nebula-dialog');
  dialog.id = 'nebula-dialog';
  dialog.setAttribute('aria-labelledby', 'nebula-title');
  const title = node('h2', `${t('title')} · ${NEBULA_EXPERIENCES.length}`);
  title.id = 'nebula-title';
  const close = node('button', '×', 'auth-close');
  close.type = 'button';
  close.setAttribute('aria-label', t('close'));
  close.addEventListener('click', () => dialog.close());
  const intro = node('p', t('guide'), 'nebula-guide');
  const overview = node('button', t('overview'), 'nebula-overview');
  overview.type = 'button';
  overview.id = 'nebula-overview';
  overview.addEventListener('click', () => {
    dialog.close();
    onOverview();
  });
  const list = node('ul', '', 'nebula-list');
  const search = node('input', '', 'nebula-search');
  search.type = 'search';
  search.id = 'nebula-atlas-search';
  search.placeholder = translate(locale, 'sky.nebulaSearch');
  search.setAttribute('aria-label', search.placeholder);
  const total = node('p', '', 'nebula-result-count');
  total.setAttribute('role', 'status');
  const empty = node('p', translate(locale, 'sky.nebulaNoResults'), 'nebula-no-results');
  empty.hidden = true;
  const cards = new Map();
  for (const record of records) {
    const item = node('li', '', record.priority ? 'nebula-card priority' : 'nebula-card');
    const image = node('img');
    image.src = record.texture;
    image.alt = locale === 'tr' ? record.nameTr : record.name;
    image.loading = 'lazy';
    const name = node('h3', locale === 'tr' ? record.nameTr : record.name);
    const focus = node('button', t('approach'));
    focus.type = 'button';
    focus.dataset.nebula = record.id;
    focus.addEventListener('click', () => {
      dialog.close();
      onFocus(record);
    });
    const source = node('a', `${record.credit} ↗`);
    source.href = record.source;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    const band = node('small', `${t('band')}: ${record.band}`);
    const infrared = node('a', 'Spitzer · NASA/JPL-Caltech ↗');
    infrared.href = record.infrared.source;
    infrared.target = '_blank';
    infrared.rel = 'noopener noreferrer';
    const gaia = node('a', 'Gaia DR3 · ESA/DPAC · CDS/VizieR ↗');
    gaia.href = 'https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=I/355/gaiadr3';
    gaia.target = '_blank';
    gaia.rel = 'noopener noreferrer';
    item.append(image, name, band, focus, source, infrared, gaia);
    list.append(item);
    cards.set(record.id, item);
  }
  for (const experience of NEBULA_EXPERIENCES.slice(1)) {
    const name = translate(locale, `sky.nebulaNames.${experience.id}`);
    const item = node('li', '', 'nebula-card nebula-original');
    const image = node('img');
    image.src = nebulaPreview(experience);
    image.alt = name;
    image.loading = 'lazy';
    const title = node('h3', name);
    const description = node('p', translate(locale, `sky.nebulaDescriptions.${experience.id}`));
    const focus = node('button', translate(locale, 'sky.nebulaDive'));
    focus.type = 'button';
    focus.dataset.nebula = experience.id;
    focus.addEventListener('click', () => {
      dialog.close();
      onExperience?.(experience.id);
    });
    item.append(image, title, description, focus, node('small', translate(locale, 'sky.artistic')));
    if (experience.source) {
      const source = node('a', `${experience.credit} ↗`);
      source.href = experience.source;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      item.append(node('small', translate(locale, 'sky.nebulaObservedGuide')), source);
    }
    list.append(item);
    cards.set(experience.id, item);
  }
  const names = Object.fromEntries(
    NEBULA_EXPERIENCES.map((item) => [item.id, translate(locale, 'sky.nebulaNames.' + item.id)]),
  );
  function filter() {
    const matches = new Set(searchNebulae(search.value, locale, names).map((item) => item.id));
    for (const [id, card] of cards) card.hidden = !matches.has(id);
    total.textContent = `${matches.size} / ${NEBULA_EXPERIENCES.length} · ${translate(locale, 'sky.nebulaCollection')}`;
    empty.hidden = matches.size > 0;
  }
  search.addEventListener('input', filter);
  filter();
  dialog.append(close, title, intro, overview, search, total, empty, list);
  document.body.append(dialog);
  open.addEventListener('click', () => {
    beforeOpen();
    dialog.showModal();
  });
  const credit = node('button', 'Orion · NASA / ESA / Spitzer · ' + t('sources'), 'nebula-credit');
  credit.type = 'button';
  credit.id = 'nebula-credit';
  credit.addEventListener('click', () => open.click());
  document.querySelector('#app').append(credit);
  return {
    focused(record) {
      credit.textContent = record
        ? `${locale === 'tr' ? record.nameTr : record.name} · ${record.credit}`
        : 'Orion · NASA / ESA / Spitzer · ' + t('sources');
    },
    dispose() {
      dialog.close();
      dialog.remove();
      open.remove();
      credit.remove();
    },
  };
}
