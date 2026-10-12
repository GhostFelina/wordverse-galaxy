import { translate } from './i18n.js';
import './graphics-fallback.css';

export function mountGraphicsFallback({ locale, onAtlas }) {
  const t = (key) => translate(locale, `graphics.${key}`);
  const app = document.querySelector('#app');
  const panel = document.createElement('section');
  panel.className = 'graphics-fallback';
  panel.hidden = true;
  const copy = document.createElement('div');
  copy.setAttribute('role', 'status');
  const heading = document.createElement('h2');
  heading.textContent = t('title');
  const description = document.createElement('p');
  description.textContent = t('copy');
  copy.append(heading, description);
  const atlas = document.createElement('button');
  atlas.type = 'button';
  atlas.id = 'graphics-open-atlas';
  atlas.textContent = t('atlas');
  atlas.addEventListener('click', onAtlas);
  panel.append(copy, atlas);
  app.append(panel);
  let available = true;
  function refresh() {
    app.dataset.graphics = available ? 'ready' : 'unavailable';
    panel.hidden = available;
    atlas.disabled = document.querySelector('#collection-btn').disabled;
    for (const selector of ['#universe-mode', '#focus-star', '#hero-explore', '#showcase-explore']) {
      const button = document.querySelector(selector);
      if (button) button.disabled = !available;
    }
    if (!available) {
      app.classList.remove('immersive');
      const mode = document.querySelector('#universe-mode');
      mode.setAttribute('aria-pressed', 'false');
      mode.setAttribute('aria-label', translate(locale, 'home.universeOnly'));
    }
  }
  return {
    refresh,
    setAvailable(value) {
      available = value;
      refresh();
    },
    get available() {
      return available;
    },
  };
}
