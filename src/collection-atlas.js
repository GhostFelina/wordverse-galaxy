import { translate } from './i18n.js';
import { entryKind } from './universe-data.js';
import './collection-atlas.css';

export function queryAtlas(records, { query = '', kind = 'all', sort = 'newest', locale = 'tr' } = {}) {
  const needle = query.trim().normalize('NFC').toLocaleLowerCase(locale);
  const date = (record) => {
    const value = Date.parse(record.createdAt);
    return Number.isFinite(value) ? value : null;
  };
  return records
    .map((record, index) => ({ record, index }))
    .filter(
      ({ record }) =>
        !record.deletedAt &&
        (kind === 'all' || entryKind(record) === kind) &&
        `${record.word || ''} ${record.meaning || ''}`.normalize('NFC').toLocaleLowerCase(locale).includes(needle),
    )
    .sort((a, b) => {
      if (sort === 'alphabetical') {
        return (
          String(a.record.word || '').localeCompare(String(b.record.word || ''), locale, {
            sensitivity: 'base',
            numeric: true,
          }) || a.index - b.index
        );
      }
      const first = date(a.record),
        second = date(b.record);
      if (first === null || second === null) return first === second ? b.index - a.index : first === null ? 1 : -1;
      return (sort === 'oldest' ? first - second : second - first) || b.index - a.index;
    })
    .map(({ record }) => record);
}

export function mountCollectionAtlas({ locale, onChange, onBack }) {
  const t = (key) => translate(locale, `atlas.${key}`);
  const search = document.querySelector('#search-input');
  const back = document.createElement('button');
  back.type = 'button';
  back.id = 'detail-atlas-back';
  back.className = 'atlas-back';
  back.textContent = `← ${t('back')}`;
  back.hidden = true;
  back.addEventListener('click', onBack);
  document.querySelector('#detail-panel .detail-visual').before(back);
  const meta = document.querySelector('#collection-panel .collection-meta');
  const toolbar = document.createElement('div');
  toolbar.className = 'atlas-toolbar';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', t('filter'));
  let kind = 'all';
  const filters = new Map();
  for (const [value, label] of [
    ['all', 'all'],
    ['word', 'words'],
    ['conjunction', 'conjunctions'],
  ]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.atlasKind = value;
    button.textContent = t(label);
    button.setAttribute('aria-pressed', String(value === kind));
    const count = document.createElement('span');
    count.setAttribute('aria-hidden', 'true');
    button.append(count);
    button.addEventListener('click', () => {
      kind = value;
      for (const [key, filter] of filters) filter.button.setAttribute('aria-pressed', String(key === kind));
      onChange();
    });
    filters.set(value, { button, count });
    toolbar.append(button);
  }
  meta.before(toolbar);
  const sortLabel = document.createElement('label');
  sortLabel.className = 'atlas-sort';
  const labelText = document.createElement('span');
  labelText.className = 'atlas-sr-only';
  labelText.textContent = t('sort');
  const sort = document.createElement('select');
  sort.id = 'atlas-sort';
  for (const mode of ['newest', 'oldest', 'alphabetical']) {
    const option = document.createElement('option');
    option.value = mode;
    option.textContent = t(mode);
    sort.append(option);
  }
  sort.addEventListener('change', onChange);
  sortLabel.append(labelText, sort);
  meta.append(sortLabel);
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'atlas-search-clear';
  clear.textContent = '×';
  clear.setAttribute('aria-label', t('clearSearch'));
  clear.hidden = true;
  clear.addEventListener('click', () => {
    search.value = '';
    onChange();
    search.focus();
  });
  search.parentElement.append(clear);
  const state = () => ({ query: search.value, kind, sort: sort.value, locale });
  const reset = (notify = false) => {
    kind = 'all';
    sort.value = 'newest';
    search.value = '';
    clear.hidden = true;
    for (const [key, filter] of filters) filter.button.setAttribute('aria-pressed', String(key === kind));
    if (notify) {
      onChange();
      search.focus();
    }
  };
  return {
    state,
    reset,
    update(records) {
      clear.hidden = !search.value;
      for (const [key, filter] of filters) {
        filter.count.textContent = String(
          records.filter((record) => !record.deletedAt && (key === 'all' || entryKind(record) === key)).length,
        );
      }
    },
    appendEmptyAction(container) {
      if (!search.value && kind === 'all') return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'atlas-reset';
      button.textContent = t('reset');
      button.addEventListener('click', () => reset(true));
      container.append(button);
    },
  };
}
