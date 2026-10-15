import { localePath, translate } from './i18n.js';

const languages = [
  ['tr', 'Türkçe', 'Turkish'],
  ['en', 'English', 'English'],
  ['es', 'Español', 'Spanish'],
];

export function mountLanguagePicker(locale) {
  const native = document.querySelector('#ui-language');
  if (!native || document.querySelector('#language-picker')) return;
  const t = (key) => translate(locale, `home.${key}`);
  const root = document.createElement('div');
  root.id = 'language-picker';
  root.className = 'language-picker';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = 'language-trigger';
  trigger.className = 'language-trigger';
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'language-menu');
  trigger.setAttribute('aria-label', `${t('languagePicker')}: ${languages.find(([code]) => code === locale)[1]}`);
  const globe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  globe.setAttribute('viewBox', '0 0 24 24');
  globe.setAttribute('fill', 'none');
  globe.setAttribute('stroke', 'currentColor');
  globe.setAttribute('stroke-width', '1.4');
  globe.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(globe.namespaceURI, 'path');
  path.setAttribute('d', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c4 4 4 14 0 18-4-4-4-14 0-18Z');
  globe.append(path);
  const current = document.createElement('span');
  current.className = 'language-current';
  current.textContent = languages.find(([code]) => code === locale)[1];
  const chevron = document.createElement('span');
  chevron.className = 'language-chevron';
  chevron.textContent = '⌄';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(globe, current, chevron);
  const menu = document.createElement('div');
  menu.id = 'language-menu';
  menu.className = 'language-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', t('languagePicker'));
  menu.hidden = true;
  const heading = document.createElement('p');
  heading.className = 'language-menu-heading';
  heading.textContent = t('languagePicker');
  heading.setAttribute('role', 'presentation');
  menu.append(heading);
  const options = languages.map(([code, name]) => {
    const option = document.createElement('a');
    option.href = localePath(code);
    option.dataset.localeOption = code;
    option.setAttribute('role', 'menuitemradio');
    option.setAttribute('aria-checked', String(locale === code));
    option.lang = code;
    option.tabIndex = -1;
    const monogram = document.createElement('span');
    monogram.className = 'language-monogram';
    monogram.textContent = code.toUpperCase();
    const copy = document.createElement('span');
    copy.textContent = name;
    const check = document.createElement('span');
    check.className = 'language-check';
    check.textContent = locale === code ? '✓' : '';
    check.setAttribute('aria-hidden', 'true');
    option.append(monogram, copy, check);
    menu.append(option);
    return option;
  });
  const hint = document.createElement('p');
  hint.className = 'language-menu-hint';
  hint.textContent = t('languageHint');
  hint.setAttribute('role', 'presentation');
  menu.append(hint);
  function setOpen(open, focus = false) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (focus) (open ? options.find((option) => option.dataset.localeOption === locale) : trigger).focus();
  }
  trigger.addEventListener('click', () => setOpen(menu.hidden, true));
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true, true);
    }
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, true);
    }
    const index = options.indexOf(document.activeElement);
    if (index < 0) return;
    if (event.key === ' ') {
      event.preventDefault();
      options[index].click();
      return;
    }
    const next =
      event.key === 'ArrowDown'
        ? (index + 1) % options.length
        : event.key === 'ArrowUp'
          ? (index + options.length - 1) % options.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? options.length - 1
              : -1;
    if (next >= 0) {
      event.preventDefault();
      options[next].focus();
    }
    if (event.key === 'Tab') setOpen(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!root.contains(event.target)) setOpen(false);
  });
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget)) setOpen(false);
  });
  root.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
  root.append(trigger, menu);
  native.insertAdjacentElement('afterend', root);
  native.classList.add('language-native-fallback');
  native.setAttribute('aria-hidden', 'true');
  native.tabIndex = -1;
}
