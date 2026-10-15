import { translate } from './i18n.js';
import './scene-controls.css';

export function mountSceneControls({
  locale,
  onQuality,
  onMotion = () => {},
  onStars = () => {},
  onNebula = () => {},
}) {
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
  const starHeading = document.createElement('h3');
  starHeading.className = 'star-view-heading';
  starHeading.textContent = t('starView');
  content.append(starHeading);
  const starPreferences = {};
  for (const [key, values, fallback] of [
    ['paths', ['off', 'on'], 'off'],
    ['labels', ['hover', 'all', 'none'], 'hover'],
  ]) {
    const label = document.createElement('label');
    label.htmlFor = `star-${key}`;
    label.textContent = t(key);
    const select = document.createElement('select');
    select.id = `star-${key}`;
    for (const value of values) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = t(`${key}${value[0].toUpperCase()}${value.slice(1)}`);
      select.append(option);
    }
    let saved;
    try {
      saved = localStorage.getItem(`wordverse.star-${key}`);
    } catch {
      /* Optional preference. */
    }
    select.value = values.includes(saved) ? saved : fallback;
    starPreferences[key] = select.value;
    select.addEventListener('change', () => {
      starPreferences[key] = select.value;
      onStars({ ...starPreferences });
      try {
        localStorage.setItem(`wordverse.star-${key}`, select.value);
      } catch {
        /* Optional preference. */
      }
    });
    content.append(label, select);
  }
  const starHint = document.createElement('p');
  starHint.textContent = t('pathsHint');
  content.append(starHint);
  const gasHeading = document.createElement('h3');
  gasHeading.textContent = t('gasTitle');
  content.append(gasHeading);
  const gasPreferences = {};
  for (const [key, min, max, fallback] of [
    ['density', 40, 140, 85],
    ['light', 60, 140, 100],
  ]) {
    const label = document.createElement('label');
    label.htmlFor = `nebula-${key}`;
    const copy = document.createElement('span');
    copy.textContent = t(`gas${key[0].toUpperCase()}${key.slice(1)}`);
    const output = document.createElement('output');
    output.htmlFor = `nebula-${key}`;
    const input = document.createElement('input');
    input.id = `nebula-${key}`;
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = '5';
    let stored = fallback;
    try {
      const saved = Number(localStorage.getItem(`wordverse.nebula-${key}`));
      if (saved >= min && saved <= max) stored = saved;
    } catch {
      /* Optional preference. */
    }
    input.value = String(stored);
    gasPreferences[key] = stored / 100;
    output.value = `${stored}%`;
    label.className = 'nebula-appearance-label';
    label.append(copy, output);
    input.addEventListener('input', () => {
      gasPreferences[key] = Number(input.value) / 100;
      output.value = `${input.value}%`;
      onNebula({ ...gasPreferences });
    });
    input.addEventListener('change', () => {
      try {
        localStorage.setItem(`wordverse.nebula-${key}`, input.value);
      } catch {
        /* Optional preference. */
      }
    });
    content.append(label, input);
  }
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
  onStars({ ...starPreferences });
  onNebula({ ...gasPreferences });
}
