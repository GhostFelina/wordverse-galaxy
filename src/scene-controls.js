import { translate } from './i18n.js';
import './scene-controls.css';

export function mountSceneControls({ locale, onQuality, onMotion = () => {} }) {
  const t = (key) => translate(locale, `scene.${key}`);
  const panel = document.createElement('details');
  panel.className = 'scene-controls';
  panel.id = 'scene-controls';
  const summary = document.createElement('summary');
  summary.textContent = t('title');
  const content = document.createElement('div');
  content.className = 'scene-controls-content';
  const label = document.createElement('label');
  label.htmlFor = 'render-quality';
  label.textContent = t('quality');
  const select = document.createElement('select');
  select.id = 'render-quality';
  for (const mode of ['auto', 'high', 'balanced', 'low']) {
    const option = document.createElement('option');
    option.value = mode;
    option.textContent = t(mode);
    select.append(option);
  }
  let stored = 'auto';
  try {
    stored = localStorage.getItem('wordverse.render-quality') || 'auto';
  } catch {
    /* Preference storage is optional. */
  }
  select.value = ['auto', 'high', 'balanced', 'low'].includes(stored) ? stored : 'auto';
  select.addEventListener('change', () => {
    onQuality(select.value);
    try {
      localStorage.setItem('wordverse.render-quality', select.value);
    } catch {
      /* Learning storage remains independent. */
    }
  });
  const description = document.createElement('p');
  description.textContent = t('qualityHint');
  const heading = document.createElement('h3');
  const motionLabel = document.createElement('label');
  motionLabel.htmlFor = 'scene-motion';
  motionLabel.textContent = t('motion');
  const motion = document.createElement('select');
  motion.id = 'scene-motion';
  for (const value of ['system', 'full', 'reduced']) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(`motion${value[0].toUpperCase()}${value.slice(1)}`);
    motion.append(option);
  }
  try {
    motion.value = localStorage.getItem('wordverse.motion') || 'system';
  } catch {
    /* Optional preference. */
  }
  if (!['system', 'full', 'reduced'].includes(motion.value)) motion.value = 'system';
  motion.addEventListener('change', () => {
    onMotion(motion.value);
    try {
      localStorage.setItem('wordverse.motion', motion.value);
    } catch {
      /* Optional preference. */
    }
  });
  const motionHint = document.createElement('p');
  motionHint.textContent = t('motionHint');
  heading.textContent = t('navigation');
  const instructions = document.createElement('dl');
  for (const key of ['mouse', 'touch', 'keyboard', 'return']) {
    const term = document.createElement('dt');
    term.textContent = t(key);
    const definition = document.createElement('dd');
    definition.textContent = t(`${key}Hint`);
    instructions.append(term, definition);
  }
  content.append(label, select, description, motionLabel, motion, motionHint, heading, instructions);
  panel.append(summary, content);
  (document.querySelector('#scene-dock') || document.querySelector('#app')).append(panel);
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.open) {
      event.stopPropagation();
      panel.open = false;
      summary.focus();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!panel.contains(event.target)) panel.open = false;
  });
  onQuality(select.value);
  onMotion(motion.value);
}
