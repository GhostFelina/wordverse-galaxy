import { translate, formatNumber } from './i18n.js';
import { MAX_IMPORT_BYTES, parseVocabulary, planImport, toCsv } from './vocab-import.js';

// Galaxy-panel controls for bulk word lists. Parsing and duplicate planning are
// pure (vocab-import.js); main.js owns placement, records and persistence.
export function mountVocabularyImport({
  locale,
  anchor,
  getLanguage,
  getExisting,
  getGalaxyName,
  onImport,
  notify,
  beforeOpen,
}) {
  const t = (key, params) => translate(locale, `bulk.${key}`, params);
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const wrap = node('div', '', 'bulk-actions');
  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'import-vocabulary';
  input.accept = '.csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain';
  input.hidden = true;
  const label = node('label', t('import'), 'import-universe bulk-import');
  label.htmlFor = input.id;
  const exportButton = node('button', t('export'), 'export-universe bulk-export');
  exportButton.type = 'button';
  exportButton.id = 'export-vocabulary';
  wrap.append(label, input, exportButton);
  anchor.after(wrap);

  const dialog = node('dialog', '', 'auth-dialog bulk-dialog');
  dialog.id = 'bulk-dialog';
  dialog.setAttribute('aria-labelledby', 'bulk-title');
  document.body.append(dialog);
  let pending = null;

  function button(id, text, action, className = 'recall-action') {
    const result = node('button', text, className);
    result.type = 'button';
    result.id = id;
    result.addEventListener('click', action);
    return result;
  }
  function render(plan, format, skipped) {
    dialog.replaceChildren();
    const close = button('close-bulk', '×', () => dialog.close(), 'auth-close');
    close.setAttribute('aria-label', t('close'));
    const title = node('h2', t('title'));
    title.id = 'bulk-title';
    dialog.append(close, node('p', t('eyebrow', { galaxy: getGalaxyName() }), 'auth-kicker'), title);
    const summary = node('dl', '', 'bulk-summary');
    for (const [key, value] of [
      ['ready', plan.add.length],
      ['duplicates', plan.duplicates.length],
      ['invalid', plan.invalid.length + skipped.length],
    ]) {
      const group = node('div', '');
      group.append(node('dt', t(key)), node('dd', formatNumber(locale, value)));
      summary.append(group);
    }
    dialog.append(summary, node('p', t(`format.${format}`), 'auth-description'));
    if (plan.add.length) {
      const preview = node('ul', '', 'bulk-preview');
      preview.setAttribute('aria-label', t('preview'));
      for (const entry of plan.add.slice(0, 5)) {
        const item = node('li', '');
        item.append(node('strong', entry.word), node('span', entry.meaning));
        preview.append(item);
      }
      if (plan.add.length > 5) preview.append(node('li', t('more', { count: plan.add.length - 5 }), 'bulk-more'));
      dialog.append(preview);
    }
    const actions = node('div', '', 'recall-actions');
    if (plan.add.length)
      actions.append(
        button('bulk-confirm', t('confirm', { count: plan.add.length }), () => {
          const entries = pending;
          pending = null;
          dialog.close();
          const added = onImport(entries);
          notify(t('done', { count: added }));
        }),
      );
    actions.append(
      button(
        'bulk-cancel',
        t(plan.add.length ? 'cancel' : 'closeEmpty'),
        () => dialog.close(),
        'recall-action recall-secondary',
      ),
    );
    dialog.append(actions, node('p', t('note'), 'recall-note'));
  }

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      notify(t('tooLarge'));
      return;
    }
    let parsed;
    try {
      parsed = parseVocabulary(await file.text());
    } catch {
      notify(t('unreadable'));
      return;
    }
    const plan = planImport(parsed.rows, getExisting(), { language: getLanguage() });
    pending = plan.add.map(({ line: _line, ...fields }) => fields);
    beforeOpen?.();
    render(plan, parsed.format, parsed.skipped);
    dialog.showModal();
    dialog.querySelector('#bulk-confirm,#bulk-cancel')?.focus();
  });
  dialog.addEventListener('close', () => {
    pending = null;
    dialog.replaceChildren();
  });

  exportButton.addEventListener('click', () => {
    const records = getExisting();
    const blob = new Blob([toCsv(records)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug =
      String(getGalaxyName() || 'galaxy')
        .toLocaleLowerCase(locale)
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'galaxy';
    link.href = url;
    link.download = `wordverse-${slug}-${new Date().toLocaleDateString('sv-SE')}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(t('exported', { count: records.length }));
  });

  return {
    refresh() {
      exportButton.disabled = !getExisting().length;
    },
  };
}
