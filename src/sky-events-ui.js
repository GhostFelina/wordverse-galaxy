import { translate } from './i18n.js';
import './sky-events.css';

export function mountSkyEventsUI({ locale, container, onSelect, onLiveChange, reducedMotion }) {
  const t = (key) => translate(locale, `sky.${key}`);
  const heading = document.createElement('h3');
  heading.textContent = t('title');
  const hint = document.createElement('p');
  hint.textContent = t(reducedMotion ? 'stillHint' : 'hint');
  const list = document.createElement('div');
  list.className = 'sky-event-options';
  const buttons = new Map();
  for (const kind of ['none', 'meteor', 'supernova', 'blackhole', 'kilonova', 'comet', 'pulsar']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.skyEvent = kind;
    button.textContent = t(kind);
    button.setAttribute('aria-pressed', String(kind === 'none'));
    button.addEventListener('click', () => onSelect(kind === 'none' ? null : kind));
    list.append(button);
    buttons.set(kind, button);
  }
  const section = document.createElement('section');
  section.append(heading, hint, list);
  container.insertBefore(section, container.querySelector(':scope > h3'));
  const status = document.createElement('div');
  status.className = 'sky-event-status';
  status.hidden = true;
  const text = document.createElement('span');
  text.setAttribute('role', 'status');
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', t('stop'));
  close.addEventListener('click', () => onSelect(null));
  status.append(text, close);
  document.querySelector('#app').append(status);
  const launcher = document.createElement('details');
  launcher.className = 'sky-launcher';
  launcher.id = 'sky-launcher';
  const summary = document.createElement('summary');
  summary.textContent = '✦ ' + t('title');
  const quickList = document.createElement('div');
  quickList.className = 'sky-event-options sky-quick-options';
  const quickButtons = new Map();
  for (const kind of ['blackhole', 'supernova', 'kilonova', 'comet', 'pulsar', 'meteor', 'none']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.skyQuick = kind;
    button.textContent = t(kind);
    button.setAttribute('aria-pressed', String(kind === 'none'));
    button.addEventListener('click', () => {
      onSelect(kind === 'none' ? null : kind);
      launcher.open = false;
    });
    quickList.append(button);
    quickButtons.set(kind, button);
  }
  launcher.append(summary, quickList);
  const live = document.createElement('button');
  live.type = 'button';
  live.id = 'living-sky';
  live.setAttribute('aria-pressed', 'true');
  live.textContent = t('livingOn');
  live.addEventListener('click', () => onLiveChange(live.getAttribute('aria-pressed') !== 'true'));
  const liveHint = document.createElement('p');
  liveHint.textContent = t('livingHint');
  quickList.append(live, liveHint);
  (document.querySelector('#scene-dock') || document.querySelector('#app')).append(launcher);
  launcher.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      launcher.open = false;
      summary.focus();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!launcher.contains(event.target)) launcher.open = false;
  });
  let previous,
    previousMotion = reducedMotion;
  return {
    update({ kind, living, reducedMotion: motion }) {
      if (typeof motion === 'boolean' && motion !== previousMotion) {
        previousMotion = motion;
        hint.textContent = t(motion ? 'stillHint' : 'hint');
      }
      if (typeof living === 'boolean') {
        live.setAttribute('aria-pressed', String(living));
        live.textContent = t(living ? 'livingOn' : 'livingOff');
      }
      if (previous === kind) return;
      previous = kind;
      for (const [id, button] of buttons) button.setAttribute('aria-pressed', String((kind || 'none') === id));
      for (const [id, button] of quickButtons) button.setAttribute('aria-pressed', String((kind || 'none') === id));
      status.hidden = !kind;
      text.textContent = kind ? `${t(kind)} · ${t('artistic')}` : '';
    },
  };
}

export function mountNebulaNavigation({ locale, onDepth, onReturn, onEnter }) {
  const t = (key) => translate(locale, `sky.${key}`);
  const enter = document.createElement('button');
  enter.type = 'button';
  enter.className = 'nebula-entry';
  enter.id = 'enter-nebula';
  const kicker = document.createElement('span');
  kicker.className = 'nebula-entry-kicker';
  kicker.textContent = 'ORION / M42';
  const entryTitle = document.createElement('span');
  entryTitle.textContent = t('enter');
  enter.append(kicker, entryTitle);
  enter.title = t('wheelHint');
  enter.addEventListener('click', onEnter);
  document.querySelector('#app').append(enter);
  const panel = document.createElement('section');
  panel.className = 'nebula-navigation';
  panel.id = 'nebula-navigation';
  panel.hidden = true;
  const label = document.createElement('label');
  label.htmlFor = 'nebula-depth';
  label.textContent = t('depth');
  const output = document.createElement('output');
  output.htmlFor = 'nebula-depth';
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'nebula-depth';
  slider.min = '0';
  slider.max = '100';
  slider.step = '1';
  slider.addEventListener('input', () => onDepth(Number(slider.value) / 100));
  const home = document.createElement('button');
  home.type = 'button';
  home.textContent = t('return');
  home.addEventListener('click', onReturn);
  const hint = document.createElement('span');
  hint.className = 'nebula-wheel-hint';
  hint.textContent = t('wheelHint');
  panel.append(label, output, slider, home, hint);
  document.querySelector('#app').append(panel);
  let previous = -1;
  return {
    update(active, fraction) {
      panel.hidden = !active;
      enter.hidden = active;
      const percent = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
      if (percent !== previous) {
        previous = percent;
        if (document.activeElement !== slider) slider.value = String(percent);
        output.textContent = `${percent}%`;
        slider.setAttribute('aria-valuetext', `${percent}% · ${t('depth')}`);
      }
    },
  };
}
