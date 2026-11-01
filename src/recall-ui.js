import { translate } from './i18n.js';
import { createRecallSession } from './recall-session.js';
import { createReviewSession, DEFAULT_NEW_LIMIT } from './review-session.js';
import { createReviewStore } from './review-store.js';
import { durationParts } from './review-schedule.js';
import { syncReviewProgress } from './review-sync.js';
import './recall.css';

const LANGUAGE_TAGS = { tr: 'tr-TR', en: 'en-US', es: 'es-ES' };
const REVIEW_GRADES = ['again', 'hard', 'good', 'easy'];

function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Owner isolation: identities look like `mode:owner:galaxy`; progress belongs to `mode:owner`.
export const reviewOwnerKey = (identity) => (identity ? identity.split(':').slice(0, 2).join(':') : null);

export function mountRecallUI({
  locale,
  getRecords,
  getIdentity,
  beforeOpen,
  getOwnerRecordIds,
  getCloud,
  storage = browserStorage(),
}) {
  const t = (key, params) => translate(locale, `recall.${key}`, params);
  const tag = LANGUAGE_TAGS[locale] || 'tr-TR';
  const node = (name, text, className) => {
    const element = document.createElement(name);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const duration = (ms) => {
    const { value, unit } = durationParts(ms);
    return new Intl.NumberFormat(tag, { style: 'unit', unit, unitDisplay: 'short' }).format(value);
  };
  const relative = (iso) => {
    const ms = Date.parse(iso) - Date.now();
    const { value, unit } = durationParts(Math.max(60_000, ms));
    return new Intl.RelativeTimeFormat(tag, { numeric: 'auto' }).format(Math.round(value), unit);
  };
  const dialog = node('dialog', '', 'auth-dialog recall-dialog');
  dialog.id = 'recall-dialog';
  dialog.setAttribute('aria-labelledby', 'recall-title');
  const trigger = node('button', t('open'), 'recall-trigger');
  trigger.id = 'open-recall';
  trigger.type = 'button';
  document.querySelector('#collection-panel .search-wrap').before(trigger);
  const homeTrigger = node('button', t('homeOpen'), 'home-recall');
  homeTrigger.id = 'home-recall';
  homeTrigger.type = 'button';
  homeTrigger.hidden = true;
  document.querySelector('#home-learning')?.prepend(homeTrigger);
  document.body.append(dialog);

  const stores = new Map();
  let session = null,
    mode = null,
    identity = null,
    returnTarget = null,
    saveFailed = false,
    syncState = null,
    dirty = false,
    reviewCount = 0,
    syncing = null;
  const memoryStorage = () => {
    const data = new Map();
    return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
  };
  function storeFor(id) {
    const ownerKey = reviewOwnerKey(id);
    if (!ownerKey) return null;
    if (!stores.has(ownerKey)) stores.set(ownerKey, createReviewStore(storage || memoryStorage(), ownerKey));
    return stores.get(ownerKey);
  }
  const currentStore = () => storeFor(getIdentity());

  function button(id, label, action, className = 'recall-action') {
    const result = node('button', label, className);
    result.type = 'button';
    result.id = id;
    result.addEventListener('click', action);
    return result;
  }
  function header(titleKey, state) {
    const close = button('close-recall', '×', () => dialog.close(), 'auth-close');
    close.setAttribute('aria-label', t('close'));
    const title = node('h2', t(titleKey));
    title.id = 'recall-title';
    dialog.append(close, node('p', t('eyebrow'), 'auth-kicker'), title);
    if (!state) return;
    const progress = node('p', t('progress', { current: state.completed, total: state.total }), 'recall-progress');
    progress.setAttribute('aria-live', 'polite');
    dialog.append(progress);
    if (state.total) {
      const meter = node('progress', '', 'recall-meter');
      meter.max = state.total;
      meter.value = state.completed;
      meter.setAttribute('aria-label', progress.textContent);
      dialog.append(meter);
    }
  }
  function statsLine(store) {
    const summary = store.summary(getRecords());
    const line = node(
      'p',
      t('stats', { today: summary.today.reviewed, streak: summary.streak, mature: summary.mature }),
      'recall-stats',
    );
    line.id = 'recall-stats';
    return { line, summary };
  }
  function cardView(state) {
    const card = node('section', '', 'recall-card');
    if (state.card.isNew) card.append(node('span', t('newBadge'), 'recall-badge'));
    const word = node('h3', state.card.word);
    word.id = 'recall-word';
    card.setAttribute('aria-labelledby', word.id);
    card.append(word);
    if (state.revealed) {
      card.append(node('p', state.card.meaning, 'recall-meaning'));
      if (state.card.example) card.append(node('p', state.card.example, 'recall-example'));
    } else card.append(node('p', t('think'), 'auth-description'));
    return card;
  }
  function revealButton() {
    return button('recall-reveal', t('reveal'), () => {
      session.reveal();
      render();
      focusPrimary();
    });
  }

  function renderReview() {
    const store = currentStore();
    const state = session.snapshot();
    header('titleReview', state);
    if (state.done) {
      const { line, summary } = statsLine(store);
      dialog.append(
        node('h3', t('done')),
        node('p', t('reviewResult', { total: state.total, again: state.grades.again }), 'auth-description'),
        line,
      );
      if (summary.nextDue) dialog.append(node('p', t('nextDue', { when: relative(summary.nextDue) }), 'recall-next'));
      dialog.append(button('recall-finish', t('finish'), () => dialog.close()));
      footer();
      return;
    }
    dialog.append(cardView(state));
    if (!state.revealed) dialog.append(revealButton());
    else {
      const actions = node('div', '', 'recall-actions recall-grades');
      REVIEW_GRADES.forEach((grade, index) => {
        const action = button(`recall-${grade}`, '', () => rate(grade), `recall-action recall-grade-${grade}`);
        action.append(node('span', t(`grade.${grade}`)), node('small', duration(state.intervals[grade])));
        action.setAttribute('aria-keyshortcuts', String(index + 1));
        action.setAttribute('aria-label', `${t(`grade.${grade}`)} · ${duration(state.intervals[grade])}`);
        actions.append(action);
      });
      dialog.append(actions);
    }
    dialog.append(node('p', t('keys'), 'recall-keys'));
    footer();
  }
  function renderCaughtUp() {
    const store = currentStore();
    header('caughtUp');
    const { line, summary } = statsLine(store);
    dialog.append(line);
    dialog.append(
      node(
        'p',
        summary.nextDue ? t('nextDue', { when: relative(summary.nextDue) }) : t('nothingScheduled'),
        'recall-next',
      ),
    );
    dialog.append(
      button('recall-practice', t('practice'), () => {
        mode = 'practice';
        session = createRecallSession(getRecords());
        render();
        focusPrimary();
      }),
      button('recall-finish', t('finish'), () => dialog.close(), 'recall-action recall-secondary'),
    );
  }
  function renderPractice() {
    const state = session.snapshot();
    header('title', state);
    if (!state.total) {
      dialog.append(node('p', t('empty'), 'auth-description'));
      return;
    }
    if (state.done) {
      dialog.append(
        node('h3', t('done')),
        node('p', t('result', { remembered: state.remembered, total: state.total }), 'auth-description'),
      );
      if (state.retryCount)
        dialog.append(
          button('recall-retry', t('retry'), () => {
            session = createRecallSession(session.retryRecords());
            render();
            focusPrimary();
          }),
        );
      dialog.append(
        button('recall-finish', t('finish'), () => dialog.close()),
        node('p', t('sessionOnly'), 'recall-note'),
      );
      return;
    }
    dialog.append(cardView(state));
    if (!state.revealed) dialog.append(revealButton());
    else {
      const actions = node('div', '', 'recall-actions');
      for (const value of ['again', 'remembered'])
        actions.append(
          button(`recall-${value}`, t(value), () => {
            session.rate(value);
            render();
            focusPrimary();
          }),
        );
      dialog.append(actions);
    }
    dialog.append(node('p', t('sessionOnly'), 'recall-note'));
  }
  function footer() {
    if (syncState) {
      const status = node('p', t(`sync.${syncState}`), `recall-sync recall-sync-${syncState}`);
      status.id = 'recall-sync';
      status.setAttribute('aria-live', 'polite');
      dialog.append(status);
    }
    dialog.append(
      node(
        'p',
        saveFailed ? t('saveFailed') : t('scheduleNote'),
        saveFailed ? 'recall-note recall-warning' : 'recall-note',
      ),
    );
  }
  function render() {
    if (identity !== getIdentity()) {
      invalidate();
      return;
    }
    dialog.replaceChildren();
    if (mode === 'review') renderReview();
    else if (mode === 'caught-up') renderCaughtUp();
    else renderPractice();
  }
  function rate(grade) {
    if (mode !== 'review' || !session?.snapshot().revealed) return;
    session.rate(grade);
    render();
    focusPrimary();
    refresh();
  }
  function focusPrimary() {
    dialog
      .querySelector('#recall-reveal,#recall-good,#recall-remembered,#recall-retry,#recall-practice,#recall-finish')
      ?.focus();
  }
  function invalidate() {
    session = null;
    mode = null;
    identity = null;
    if (dialog.open) dialog.close();
    dialog.replaceChildren();
  }
  // Account sync runs only around recall use, never on page load, so other
  // account traffic is unchanged. Local progress is always kept on failure.
  async function syncProgress(store) {
    if (!getCloud) return;
    if (syncing) return syncing;
    syncing = (async () => {
      let cloud;
      try {
        cloud = await getCloud();
      } catch {
        cloud = null;
      }
      if (!cloud || reviewOwnerKey(getIdentity()) !== store.ownerKey) return;
      const sessionIdentity = identity;
      const countAtStart = reviewCount;
      syncState = 'syncing';
      if (dialog.open) renderSyncState();
      try {
        const result = await syncReviewProgress({ client: cloud.client, ownerId: cloud.ownerId, store });
        dirty = reviewCount !== countAtStart;
        syncState = 'synced';
        // Fresh progress from another device: restart an untouched session.
        const state = session?.snapshot();
        if (
          result.merged &&
          dialog.open &&
          identity === sessionIdentity &&
          mode !== 'practice' &&
          state &&
          !state.completed &&
          !state.revealed &&
          !state.grades.again
        ) {
          openSession(store);
          render();
          focusPrimary();
        }
      } catch {
        syncState = 'failed';
      }
      if (dialog.open) renderSyncState();
      refresh();
    })().finally(() => {
      syncing = null;
      // Reviews made while a sync was in flight are pushed once it settles.
      if (dirty && syncState === 'synced' && !dialog.open) syncProgress(store);
    });
    return syncing;
  }
  function renderSyncState() {
    const current = dialog.querySelector('#recall-sync');
    if (current) current.textContent = t(`sync.${syncState}`);
    else if (mode !== 'practice') render();
  }
  function openSession(store) {
    session = createReviewSession(getRecords(), {
      getCard: store.card,
      onReview: (id, card, grade) => {
        dirty = true;
        reviewCount++;
        if (!store.record(id, card, grade)) saveFailed = true;
      },
    });
    mode = session.snapshot().total ? 'review' : 'caught-up';
  }
  function start(event) {
    const store = currentStore();
    if (!store) return;
    returnTarget = event.currentTarget;
    identity = getIdentity();
    saveFailed = false;
    if (getOwnerRecordIds) store.prune(getOwnerRecordIds());
    syncState = null;
    openSession(store);
    beforeOpen();
    render();
    dialog.showModal();
    focusPrimary();
    syncProgress(store);
  }
  dialog.addEventListener('keydown', (event) => {
    if (mode !== 'review' || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = ['1', '2', '3', '4'].indexOf(event.key);
    if (index >= 0 && session?.snapshot().revealed) {
      event.preventDefault();
      rate(REVIEW_GRADES[index]);
    }
  });
  trigger.addEventListener('click', start);
  homeTrigger.addEventListener('click', start);
  dialog.addEventListener('close', () => {
    const store = currentStore();
    if (dirty && store) syncProgress(store);
    session = null;
    mode = null;
    identity = null;
    dialog.replaceChildren();
    refresh();
    const target =
      returnTarget?.isConnected && !returnTarget.hidden && returnTarget !== trigger
        ? returnTarget
        : document.querySelector('#collection-btn');
    target?.focus();
    returnTarget = null;
  });
  function refresh() {
    const records = getRecords();
    const store = currentStore();
    trigger.disabled = !store || !records.length;
    homeTrigger.hidden = trigger.disabled;
    if (store && records.length) {
      const summary = store.summary(records);
      const fresh = Math.min(summary.fresh, DEFAULT_NEW_LIMIT);
      if (summary.due) {
        trigger.textContent = t('openDue', { count: summary.due });
        homeTrigger.textContent = t('homeDue', { count: summary.due });
      } else if (fresh) {
        trigger.textContent = t('openNew', { count: fresh });
        homeTrigger.textContent = t('homeNew');
      } else {
        trigger.textContent = t('openDone');
        homeTrigger.textContent = t('homeOpen');
      }
      trigger.dataset.due = String(summary.due);
      homeTrigger.classList.toggle('home-recall-due', summary.due > 0);
    }
    if (dialog.open && identity !== getIdentity()) invalidate();
  }
  return {
    invalidate,
    refresh,
    /** Progress for the current owner, for JSON backups. */
    exportProgress: () => currentStore()?.export() ?? null,
    importProgress: (value, idMap) => currentStore()?.import(value, idMap) ?? 0,
    /** One-line schedule status for a word in the current owner's progress, or null without an owner. */
    wordStatus(id) {
      const store = currentStore();
      if (!store) return null;
      const card = store.card(id);
      if (!card) return t('wordStatus.new');
      if (Date.parse(card.due) <= Date.now()) return t('wordStatus.due');
      return t('wordStatus.next', { when: relative(card.due), reps: card.reps });
    },
  };
}
