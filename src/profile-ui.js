import { translate, formatNumber, formatDate } from './i18n.js';
import { profileStatistics } from './profile-statistics.js';
import './profile.css';

export function mountProfileUI({ locale, getUniverse, beforeOpen }) {
  const t = (key) => translate(locale, `profile.${key}`);
  const dialog = document.createElement('dialog');
  dialog.id = 'profile-dialog';
  dialog.className = 'auth-dialog profile-dialog';
  dialog.setAttribute('aria-labelledby', 'profile-title');
  document.body.append(dialog);
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  function open() {
    beforeOpen();
    const statistics = profileStatistics(getUniverse());
    dialog.replaceChildren();
    const close = node('button', '×', 'auth-close');
    close.type = 'button';
    close.setAttribute('aria-label', t('close'));
    close.addEventListener('click', () => dialog.close());
    const title = node('h2', t('title'));
    title.id = 'profile-title';
    dialog.append(close, title, node('p', t('scope'), 'auth-description'));
    const totals = node('dl', '', 'profile-totals');
    for (const key of ['stars', 'planets', 'galaxies']) {
      const group = node('div', '');
      group.append(node('dt', t(key)), node('dd', formatNumber(locale, statistics[key])));
      totals.append(group);
    }
    dialog.append(totals, node('h3', t('languages')));
    if (!statistics.languages.length) dialog.append(node('p', t('empty')));
    else {
      const list = node('ul', '', 'profile-languages');
      for (const { language, count } of statistics.languages) {
        const label = { English: 'en', İngilizce: 'en', Spanish: 'es', İspanyolca: 'es', Turkish: 'tr', Türkçe: 'tr' }[
          language
        ];
        list.append(
          node(
            'li',
            `${label ? translate(locale, `names.language.${label}`) : language || t('unknownLanguage')} · ${formatNumber(locale, count)}`,
          ),
        );
      }
      dialog.append(list);
    }
    dialog.append(node('h3', t('oldest')));
    dialog.append(
      node(
        'p',
        statistics.oldest
          ? `${statistics.oldest.word} · ${formatDate(locale, statistics.oldest.createdAt)}`
          : t('empty'),
      ),
    );
    dialog.append(node('h3', t('recent')));
    const recent = node('ol', '', 'profile-recent');
    for (const entry of statistics.recent)
      recent.append(node('li', `${entry.word} · ${formatDate(locale, entry.createdAt)}`));
    dialog.append(statistics.recent.length ? recent : node('p', t('empty')));
    dialog.append(node('p', t('reviewPending'), 'auth-description'));
    dialog.showModal();
  }
  return { open, close: () => dialog.close() };
}
