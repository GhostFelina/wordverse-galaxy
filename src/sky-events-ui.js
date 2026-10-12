import { translate } from './i18n.js';
import './sky-events.css';

export function mountSkyEventsUI({ locale, container, onSelect, reducedMotion }) {
  const t = (key) => translate(locale, `sky.${key}`);
  const heading = document.createElement('h3');
  heading.textContent = t('title');
  const hint = document.createElement('p');
  hint.textContent = t(reducedMotion ? 'stillHint' : 'hint');
  const list = document.createElement('div');
  list.className = 'sky-event-options';
  const buttons = new Map();
  for (const kind of ['none', 'meteor', 'supernova', 'blackhole']) {
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
  let previous;
  return {
    update({ kind }) {
      if (previous === kind) return;
      previous = kind;
      for (const [id, button] of buttons) button.setAttribute('aria-pressed', String((kind || 'none') === id));
      status.hidden = !kind;
      text.textContent = kind ? `${t(kind)} · ${t('artistic')}` : '';
    },
  };
}

export function mountNebulaNavigation({ locale, onDepth, onReturn }) {
  const t = (key) => translate(locale, `sky.${key}`);
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
  panel.append(label, output, slider, home);
  document.querySelector('#app').append(panel);
  let previous = -1;
  return {
    update(active, fraction) {
      panel.hidden = !active;
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
