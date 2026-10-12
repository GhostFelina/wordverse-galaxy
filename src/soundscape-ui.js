import { translate } from './i18n.js';
import { createSoundscape } from './soundscape.js';
import './soundscape.css';

export function mountSoundscape({ locale, container }) {
  const t = (key) => translate(locale, `sound.${key}`);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'soundscape-toggle';
  toggle.className = 'soundscape-toggle';
  const icon = document.createElement('span');
  icon.textContent = '∿';
  icon.setAttribute('aria-hidden', 'true');
  const title = document.createElement('span');
  toggle.append(icon, title);
  const section = document.createElement('section');
  section.className = 'soundscape-controls';
  const heading = document.createElement('h3');
  heading.textContent = t('title');
  const description = document.createElement('p');
  description.textContent = t('hint');
  const label = document.createElement('label');
  label.htmlFor = 'soundscape-volume';
  label.textContent = t('volume');
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'soundscape-volume';
  slider.min = '0';
  slider.max = '100';
  slider.step = '1';
  slider.value = '32';
  const status = document.createElement('span');
  status.className = 'soundscape-state';
  status.setAttribute('role', 'status');
  section.append(heading, description, label, slider, status);
  container.insertBefore(section, container.querySelector(':scope > h3'));
  const supported = typeof window.AudioContext === 'function';
  const sound = createSoundscape({ onChange: update });
  function update(state) {
    const playing = state.enabled && state.state === 'running';
    title.textContent = t(playing ? 'on' : 'off');
    toggle.setAttribute('aria-pressed', String(state.enabled));
    toggle.setAttribute('aria-label', t(state.enabled ? 'disable' : 'enable'));
    toggle.dataset.audioState = state.state;
    slider.setAttribute('aria-valuetext', `${Math.round(state.volume * 100)}%`);
    status.textContent = t(!supported ? 'unsupported' : playing ? 'playing' : state.enabled ? 'paused' : 'quiet');
  }
  toggle.disabled = !supported;
  update(sound.snapshot());
  toggle.addEventListener('click', () => {
    void sound.toggle();
  });
  slider.addEventListener('input', () => sound.setVolume(Number(slider.value) / 100));
  const visibility = () => {
    void sound.setHidden(document.hidden);
  };
  document.addEventListener('visibilitychange', visibility);
  document.querySelector('#app').append(toggle);
  const restored = (event) => {
    if (event.persisted) visibility();
  };
  const leaving = (event) => {
    if (event.persisted) {
      void sound.setHidden(true);
      return;
    }
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pageshow', restored);
    window.removeEventListener('pagehide', leaving);
    void sound.dispose();
  };
  window.addEventListener('pageshow', restored);
  window.addEventListener('pagehide', leaving);
  return sound;
}
