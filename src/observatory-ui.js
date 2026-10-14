import { translate } from './i18n.js';
import { recentRecords, randomWord, neighboringRecord } from './word-exploration.js';
import { icon } from './interface-icons.js';
import './observatory.css';

const node = (tag, className, text = '') => {
  const result = document.createElement(tag);
  result.className = className;
  result.textContent = text;
  return result;
};

export function mountObservatory({ locale, getRecords, isReady, getSelectedId, onSelect }) {
  const t = (key, params) => translate(locale, `observatory.${key}`, params);
  const section = node('section', 'home-recent');
  section.id = 'home-recent';
  section.hidden = true;
  section.setAttribute('aria-label', t('recent'));
  const header = node('div', 'home-recent-heading');
  const title = node('h2', '', t('recent'));
  const random = node('button', 'random-word', t('random'));
  random.id = 'random-word';
  random.type = 'button';
  random.prepend(icon('shuffle'));
  random.addEventListener('click', () => {
    if (!isReady()) return;
    const record = randomWord(getRecords(), getSelectedId());
    if (record) onSelect(record.id);
  });
  header.append(title, random);
  const list = node('div', 'recent-word-list');
  section.append(header, list);
  document.querySelector('#hero').append(section);
  return {
    refresh() {
      list.replaceChildren();
      const records = isReady() ? recentRecords(getRecords(), 3) : [];
      section.hidden = !records.length;
      random.disabled = !isReady() || !randomWord(getRecords(), null, () => 0);
      for (const record of records) {
        const button = node('button', 'recent-word');
        button.type = 'button';
        button.dataset.recordId = record.id;
        button.setAttribute('aria-label', t('open', { word: record.word }));
        button.append(node('span', '', record.word), icon('arrow'));
        button.addEventListener('click', () => {
          if (isReady() && getRecords().some((current) => current.id === record.id)) onSelect(record.id);
        });
        list.append(button);
      }
    },
  };
}

export function mountRecordNavigation({ locale, onSelect }) {
  const t = (key, params) => translate(locale, `observatory.${key}`, params);
  const group = node('div', 'record-navigation');
  group.id = 'record-navigation';
  group.hidden = true;
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', t('browse'));
  let records = [],
    currentId = null;
  const status = node('span', 'record-position');
  status.setAttribute('aria-live', 'polite');
  const buttons = [-1, 1].map((direction) => {
    const button = node('button', 'record-step');
    button.id = direction < 0 ? 'previous-record' : 'next-record';
    button.type = 'button';
    button.setAttribute('aria-label', t(direction < 0 ? 'previous' : 'next'));
    button.title = t(direction < 0 ? 'previous' : 'next');
    button.append(icon(direction < 0 ? 'previous' : 'next'));
    button.addEventListener('click', () => {
      const next = neighboringRecord(records, currentId, direction);
      if (!next || records.length < 2) return;
      onSelect(next.id);
      button.focus({ preventScroll: true });
    });
    return button;
  });
  group.append(buttons[0], status, buttons[1]);
  document.querySelector('#detail-panel .detail-visual').before(group);
  return {
    update(nextRecords, nextId) {
      records = nextRecords;
      currentId = nextId;
      const index = records.findIndex((record) => record.id === currentId);
      group.hidden = index < 0 || records.length < 2;
      status.textContent = `${String(index + 1).padStart(2, '0')} / ${String(records.length).padStart(2, '0')}`;
      status.setAttribute('aria-label', t('position', { current: index + 1, total: records.length }));
      for (const button of buttons) button.disabled = records.length < 2;
    },
  };
}
