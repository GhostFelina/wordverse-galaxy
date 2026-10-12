import { translate } from './i18n.js';
import './word-card.css';

// A deliberate allowlist: no IDs, dates, examples, history or account details.
export function wordCardContent(record, { includeMeaning = false } = {}) {
  return { word: String(record.word || ''), ...(includeMeaning ? { meaning: String(record.meaning || '') } : {}) };
}

function lines(context, text, width, maximum) {
  const result = [];
  let line = '';
  for (const character of Array.from(text.replace(/\s+/g, ' ').trim())) {
    if (line && context.measureText(line + character).width > width) {
      result.push(line.trim());
      line = '';
    }
    line += character;
  }
  if (line) result.push(line.trim());
  if (result.length > maximum) {
    result.length = maximum;
    let last = result[maximum - 1];
    while (last && context.measureText(last + '…').width > width) last = Array.from(last).slice(0, -1).join('');
    result[maximum - 1] = last + '…';
  }
  return result;
}

export function renderWordCard(content, surface, portrait = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = portrait ? 1350 : 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const background = ctx.createLinearGradient(0, 0, 1080, canvas.height);
  background.addColorStop(0, '#11182b');
  background.addColorStop(0.6, '#080b14');
  background.addColorStop(1, '#030509');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1080, canvas.height);
  ctx.strokeStyle = '#26334b';
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, 992, canvas.height - 88);
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#d6e0f1';
  ctx.font = '500 28px "Space Grotesk",sans-serif';
  ctx.fillText('wordverse ✦', 86, 84);
  ctx.fillStyle = '#91a2c0';
  ctx.font = '400 16px "Space Grotesk",sans-serif';
  ctx.fillText('A WORD. A STAR. A UNIVERSE.', 86, 134);
  if (surface) ctx.drawImage(surface, 282, portrait ? 232 : 192, 516, 516);
  else {
    const glow = ctx.createRadialGradient(540, 436, 0, 540, 436, 135);
    glow.addColorStop(0, '#fff2cd');
    glow.addColorStop(0.05, '#c4cfff');
    glow.addColorStop(0.25, '#334168');
    glow.addColorStop(1, '#080b1400');
    ctx.fillStyle = glow;
    ctx.fillRect(390, 286, 300, 300);
  }
  let fontSize = 92;
  ctx.font = `500 ${fontSize}px "DM Sans",sans-serif`;
  while (lines(ctx, content.word, 870, 100).length > 2 && fontSize > 42) {
    fontSize -= 4;
    ctx.font = `500 ${fontSize}px "DM Sans",sans-serif`;
  }
  ctx.fillStyle = '#f2f3f8';
  ctx.textAlign = 'center';
  const wordLines = lines(ctx, content.word, 870, 2);
  const wordY = portrait ? 822 : 716;
  wordLines.forEach((line, i) => ctx.fillText(line, 540, wordY + i * fontSize * 1.15));
  if (content.meaning) {
    ctx.fillStyle = '#9dabc5';
    ctx.font = '400 28px "DM Sans",sans-serif';
    lines(ctx, content.meaning, 830, portrait ? 4 : 2).forEach((line, i) =>
      ctx.fillText(line, 540, wordY + wordLines.length * fontSize * 1.15 + 24 + i * 38),
    );
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7588a8';
  ctx.font = '400 18px "Space Grotesk",sans-serif';
  ctx.fillText('wordverse-galaxy.vercel.app', 86, canvas.height - 108);
  return canvas;
}

export function mountWordCard({ locale, preview, getRecord }) {
  const t = (key) => translate(locale, `share.${key}`);
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'share-word';
  button.textContent = t('open');
  document.querySelector('.detail-actions').prepend(button);
  const dialog = document.createElement('dialog');
  dialog.id = 'word-card-dialog';
  dialog.className = 'auth-dialog word-card-dialog';
  dialog.setAttribute('aria-labelledby', 'word-card-title');
  const heading = document.createElement('h2');
  heading.id = 'word-card-title';
  heading.textContent = t('title');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'auth-close';
  close.textContent = '×';
  close.setAttribute('aria-label', t('close'));
  close.addEventListener('click', () => dialog.close());
  const hint = document.createElement('p');
  hint.textContent = t('hint');
  const format = document.createElement('select');
  format.id = 'word-card-format';
  format.setAttribute('aria-label', t('format'));
  for (const [value, key] of [
    ['square', 'square'],
    ['portrait', 'portrait'],
  ]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(key);
    format.append(option);
  }
  const label = document.createElement('label');
  label.className = 'word-card-meaning';
  const meaning = document.createElement('input');
  meaning.type = 'checkbox';
  meaning.id = 'word-card-meaning';
  label.append(meaning, document.createTextNode(t('includeMeaning')));
  const image = document.createElement('img');
  image.className = 'word-card-image';
  const download = document.createElement('button');
  download.type = 'button';
  download.id = 'word-card-download';
  download.textContent = t('download');
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  dialog.append(close, heading, hint, format, label, image, status, download);
  document.body.append(dialog);
  let generation = 0,
    url,
    blob;
  function clear() {
    generation++;
    blob = null;
    download.disabled = true;
    image.removeAttribute('src');
    image.alt = '';
    if (url) URL.revokeObjectURL(url);
    url = null;
  }
  async function update() {
    clear();
    const ticket = generation;
    const record = getRecord();
    if (!record) {
      dialog.close();
      return;
    }
    const id = record.id,
      content = wordCardContent(record, { includeMeaning: meaning.checked });
    status.textContent = t('preparing');
    try {
      await document.fonts.ready;
      const surface = preview.capture(id);
      const canvas = renderWordCard(content, surface, format.value === 'portrait');
      const next = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (ticket !== generation || getRecord()?.id !== id || !dialog.open) return;
      if (!next) throw new Error('Image unavailable');
      blob = next;
      url = URL.createObjectURL(blob);
      image.src = url;
      image.alt = `${t('preview')}: ${content.word}`;
      status.textContent = `${canvas.width} × ${canvas.height} · PNG`;
      download.disabled = false;
    } catch {
      if (ticket === generation) status.textContent = t('unavailable');
    }
  }
  button.addEventListener('click', () => {
    meaning.checked = false;
    format.value = 'square';
    dialog.showModal();
    update();
  });
  format.addEventListener('change', update);
  meaning.addEventListener('change', update);
  dialog.addEventListener('close', clear);
  download.addEventListener('click', () => {
    if (!blob || !url || !getRecord()) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wordverse-star.png';
    link.click();
  });
  return {
    invalidate() {
      dialog.close();
      clear();
    },
    setEnabled(value) {
      button.hidden = !value;
    },
  };
}
