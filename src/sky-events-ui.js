import { translate } from './i18n.js';
import './sky-events.css';
import { SKY_EVENTS } from './sky-event-catalog.js';
import { NEBULA_EXPERIENCES } from './nebula-experiences.js';

export function mountSkyEventsUI({ locale, container, onSelect, onLiveChange, reducedMotion }) {
  const t = (key) => translate(locale, `sky.${key}`);
  const heading = document.createElement('h3');
  heading.textContent = t('title');
  const hint = document.createElement('p');
  hint.textContent = t(reducedMotion ? 'stillHint' : 'hint');
  const list = document.createElement('div');
  list.className = 'sky-event-options';
  const buttons = new Map();
  for (const kind of ['none', ...Object.keys(SKY_EVENTS)]) {
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
  for (const kind of ['none', ...Object.keys(SKY_EVENTS)]) {
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

export function mountNebulaNavigation({ locale, onDepth, onReturn, onEnter, onPreview }) {
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
  const picker = document.createElement('details');
  picker.id = 'nebula-picker';
  picker.className = 'nebula-picker';
  const summary = document.createElement('summary');
  summary.textContent = t('nebulaCollection') + ' · 04';
  const gallery = document.createElement('div');
  gallery.className = 'nebula-gallery';
  const galleryHint = document.createElement('p');
  galleryHint.textContent = t('nebulaPreviewHint');
  gallery.append(galleryHint);
  const choices = new Map();
  for (const experience of NEBULA_EXPERIENCES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.nebulaSelect = experience.id;
    button.className = 'nebula-choice';
    button.setAttribute('aria-pressed', String(experience.id === 'orion'));
    const swatch = document.createElement('span');
    swatch.className = 'nebula-swatch';
    swatch.dataset.nebulaSwatch = experience.id;
    swatch.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = t('nebulaNames.' + experience.id);
    const description = document.createElement('small');
    description.textContent = t('nebulaDescriptions.' + experience.id);
    copy.append(name, description);
    const index = document.createElement('span');
    index.className = 'nebula-index';
    index.textContent = experience.code;
    button.append(swatch, copy, index);
    button.addEventListener('click', () => select(experience.id, false));
    choices.set(experience.id, button);
    gallery.append(button);
  }
  const galleryDive = document.createElement('button');
  galleryDive.type = 'button';
  galleryDive.className = 'nebula-gallery-dive';
  galleryDive.textContent = t('nebulaDive');
  galleryDive.addEventListener('click', () => select(selected, true));
  gallery.append(galleryDive);
  picker.append(summary, gallery);
  picker.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      picker.open = false;
      summary.focus();
    }
  });
  picker.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
  document.addEventListener('pointerdown', (event) => {
    if (!picker.contains(event.target)) picker.open = false;
  });
  const status = document.createElement('span');
  status.className = 'nebula-selection-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  document.querySelector('#app').append(enter, picker, status);
  let pending = false;
  let selected = 'orion';
  async function select(name, dive) {
    if (pending) return;
    pending = true;
    enter.disabled = true;
    galleryDive.disabled = true;
    for (const button of choices.values()) button.disabled = true;
    picker.setAttribute('aria-busy', 'true');
    status.textContent = t('nebulaLoading');
    status.hidden = false;
    try {
      const opened = await (dive ? onEnter(name) : onPreview(name));
      status.hidden = !!opened;
      if (!opened) status.textContent = t('nebulaFailed');
      else {
        selected = name;
        picker.open = false;
        summary.focus();
      }
    } catch {
      status.hidden = false;
      status.textContent = t('nebulaFailed');
    } finally {
      pending = false;
      enter.disabled = false;
      galleryDive.disabled = false;
      for (const button of choices.values()) button.disabled = false;
      picker.removeAttribute('aria-busy');
    }
  }
  enter.addEventListener('click', () => select(selected, true));
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
  let previousExperience;
  return {
    update(active, fraction, experience = 'orion') {
      panel.hidden = !active;
      enter.hidden = active;
      picker.hidden = active;
      selected = experience;
      if (previousExperience !== experience) {
        previousExperience = experience;
        previous = -1;
        for (const [id, button] of choices) button.setAttribute('aria-pressed', String(id === experience));
        kicker.textContent =
          t('nebulaNames.' + experience) + ' / ' + NEBULA_EXPERIENCES.find((item) => item.id === experience).code;
        entryTitle.textContent = t('nebulaDive');
        label.textContent =
          experience === 'orion' ? t('depth') : t('nebulaNames.' + experience) + ' · ' + t('nebulaDepth');
      }
      const percent = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
      if (percent !== previous) {
        previous = percent;
        if (document.activeElement !== slider) slider.value = String(percent);
        output.textContent = `${percent}%`;
        slider.setAttribute('aria-valuetext', `${percent}% · ${label.textContent}`);
      }
    },
  };
}
