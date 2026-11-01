import { translate, formatNumber, formatDate } from './i18n.js';
import { profileStatistics } from './profile-statistics.js';
import { languageCode } from './word-records.js';
import './profile.css';

export function mountProfileUI({ locale, getUniverse, beforeOpen, getReviewInsights }) {
  const t = (key, params) => translate(locale, `profile.${key}`, params);
  const tag = { tr: 'tr-TR', en: 'en-US', es: 'es-ES' }[locale] || 'tr-TR';
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
        const code = languageCode(language);
        const label = ['en', 'es', 'tr'].includes(code) ? code : null;
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
    renderReview();
    dialog.showModal();
  }
  function renderReview() {
    const insights = getReviewInsights?.();
    dialog.append(node('h3', t('reviewTitle')));
    if (!insights) {
      dialog.append(node('p', t('reviewUnavailable'), 'auth-description'));
      return;
    }
    const totals = node('dl', '', 'profile-totals profile-review-totals');
    const percent = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0 });
    for (const [key, value] of [
      ['reviewCount', formatNumber(locale, insights.reviewed)],
      ['retention', insights.retention === null ? '—' : percent.format(insights.retention)],
      ['mature', formatNumber(locale, insights.mature)],
      ['streak', formatNumber(locale, insights.streak)],
    ]) {
      const group = node('div', '');
      group.append(node('dt', t(key)), node('dd', value));
      totals.append(group);
    }
    dialog.append(totals);
    if (!insights.reviewed && !insights.reviewedWords) {
      dialog.append(node('p', t('reviewEmpty'), 'auth-description'));
      return;
    }
    // Thirty-day history: bar heights share one scale; the list stays readable for assistive tech.
    const peak = Math.max(1, ...insights.history.map((entry) => entry.reviewed));
    const chart = node('ol', '', 'profile-history');
    chart.setAttribute('aria-label', t('historyLabel'));
    const dayLabel = (day) => formatDate(locale, `${day}T12:00:00`, { day: 'numeric', month: 'short' });
    for (const entry of insights.history) {
      const bar = node('li', '');
      bar.style.setProperty('--level', String(entry.reviewed / peak));
      bar.title = t('historyDay', { day: dayLabel(entry.day), count: entry.reviewed });
      bar.setAttribute('aria-label', bar.title);
      chart.append(bar);
    }
    dialog.append(node('p', t('historyLabel'), 'profile-caption'), chart);
    const forecast = node('ol', '', 'profile-forecast');
    const weekday = new Intl.DateTimeFormat(tag, { weekday: 'short' });
    insights.forecast.forEach((entry, index) => {
      const item = node('li', '');
      const name = index === 0 ? t('today') : weekday.format(new Date(`${entry.day}T12:00:00`));
      item.append(node('span', name), node('strong', formatNumber(locale, entry.due)));
      forecast.append(item);
    });
    dialog.append(node('p', t('forecastTitle'), 'profile-caption'), forecast);
  }
  return { open, close: () => dialog.close() };
}

// Auth can emit the initial guest session after the user opens the profile.
// Only an identity transition closes it; token refresh keeps the same view.
export function profileSessionListener(profile, onSession) {
  let ownerId = null;
  return (session) => {
    const next = session?.user?.id || null;
    if (next !== ownerId) profile.close();
    ownerId = next;
    return onSession(session);
  };
}
