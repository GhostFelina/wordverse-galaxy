import { translate } from './i18n.js';
import { createRecallSession } from './recall-session.js';
import './recall.css';

export function mountRecallUI({ locale, getRecords, getIdentity, beforeOpen }) {
  const t = (key, params) => translate(locale, `recall.${key}`, params);
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
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
  let session = null,
    identity = null,
    returnTarget = null;
  function button(id, key, action, className = 'recall-action') {
    const result = node('button', t(key), className);
    result.type = 'button';
    result.id = id;
    result.addEventListener('click', action);
    return result;
  }
  function render() {
    if (identity !== getIdentity()) {
      invalidate();
      return;
    }
    const state = session.snapshot();
    dialog.replaceChildren();
    const close = button('close-recall', 'close', () => dialog.close(), 'auth-close');
    close.setAttribute('aria-label', t('close'));
    close.textContent = '×';
    dialog.append(close);
    const title = node('h2', t('title'));
    title.id = 'recall-title';
    const progress = node('p', t('progress', { current: state.completed, total: state.total }), 'recall-progress');
    progress.setAttribute('aria-live', 'polite');
    dialog.append(node('p', t('eyebrow'), 'auth-kicker'), title, progress);
    if (state.total) {
      const meter = node('progress', '', 'recall-meter');
      meter.max = state.total;
      meter.value = state.completed;
      meter.setAttribute('aria-label', progress.textContent);
      dialog.append(meter);
    }
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
          button('recall-retry', 'retry', () => {
            session = createRecallSession(session.retryRecords());
            render();
            focusPrimary();
          }),
        );
      dialog.append(
        button('recall-finish', 'finish', () => dialog.close()),
        node('p', t('sessionOnly'), 'recall-note'),
      );
      return;
    }
    const card = node('section', '', 'recall-card');
    const word = node('h3', state.card.word);
    word.id = 'recall-word';
    card.setAttribute('aria-labelledby', word.id);
    card.append(word);
    if (state.revealed) {
      card.append(node('p', state.card.meaning, 'recall-meaning'));
      if (state.card.example) card.append(node('p', state.card.example, 'recall-example'));
    } else card.append(node('p', t('think'), 'auth-description'));
    dialog.append(card);
    if (!state.revealed)
      dialog.append(
        button('recall-reveal', 'reveal', () => {
          session.reveal();
          render();
          focusPrimary();
        }),
      );
    else {
      const actions = node('div', '', 'recall-actions');
      for (const value of ['again', 'remembered'])
        actions.append(
          button(`recall-${value}`, value, () => {
            session.rate(value);
            render();
            focusPrimary();
          }),
        );
      dialog.append(actions);
    }
    dialog.append(node('p', t('sessionOnly'), 'recall-note'));
  }
  function focusPrimary() {
    dialog.querySelector('#recall-reveal,#recall-remembered,#recall-retry,#recall-finish')?.focus();
  }
  function invalidate() {
    session = null;
    identity = null;
    if (dialog.open) dialog.close();
    dialog.replaceChildren();
  }
  function start(event) {
    if (!getIdentity()) return;
    returnTarget = event.currentTarget;
    identity = getIdentity();
    session = createRecallSession(getRecords());
    beforeOpen();
    render();
    dialog.showModal();
    focusPrimary();
  }
  trigger.addEventListener('click', start);
  homeTrigger.addEventListener('click', start);
  dialog.addEventListener('close', () => {
    session = null;
    identity = null;
    dialog.replaceChildren();
    const target =
      returnTarget?.isConnected && !returnTarget.hidden && returnTarget !== trigger
        ? returnTarget
        : document.querySelector('#collection-btn');
    target?.focus();
    returnTarget = null;
  });
  return {
    invalidate,
    refresh() {
      trigger.disabled = !getIdentity() || !getRecords().length;
      homeTrigger.hidden = trigger.disabled;
      if (dialog.open && identity !== getIdentity()) invalidate();
    },
  };
}
