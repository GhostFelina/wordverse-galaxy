import { translate } from './i18n.js';
import './experience.css';

export function mountExperienceUI({ locale, onGuest, onDemo, onSignin, onExplore }) {
  const t = (key) => translate(locale, `experience.${key}`);
  const panel = document.createElement('section');
  panel.className = 'showcase-intro';
  panel.id = 'showcase-intro';
  panel.hidden = true;
  const title = document.createElement('h2');
  title.textContent = t('title');
  const copy = document.createElement('p');
  copy.textContent = t('copy');
  const actions = document.createElement('div');
  const button = (id, key, action) => {
    const node = document.createElement('button');
    node.id = id;
    node.type = 'button';
    node.textContent = t(key);
    node.addEventListener('click', action);
    return node;
  };
  actions.append(
    button('showcase-explore', 'explore', onExplore),
    button('showcase-signin', 'signin', onSignin),
    button('showcase-guest', 'guest', onGuest),
  );
  panel.append(title, copy, actions);
  document.querySelector('#app').append(panel);
  const preview = button('showcase-preview', 'preview', onDemo);
  preview.hidden = true;
  document.querySelector('.controls').append(preview);
  return {
    update(state) {
      // Initial identity resolution must be visible to both users and automation.
      // A pending account can still explicitly choose the safe guest fallback.
      document
        .querySelectorAll('#open-add,#hero-add,#collection-add,#collection-btn,#galaxy-switch')
        .forEach((node) => {
          node.disabled = !state.mode;
        });
      panel.hidden = state.mode !== 'showcase-demo';
      preview.hidden = !state.ready || state.mode !== 'guest-personal';
    },
  };
}
