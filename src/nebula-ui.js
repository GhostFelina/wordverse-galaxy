import { translate } from './i18n.js';
import './nebula.css';

export function mountNebulaUI({ locale, records, beforeOpen, onFocus, onOverview }) {
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
  const title = node('h2', t('title'));
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
  }
  dialog.append(close, title, intro, overview, list);
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
