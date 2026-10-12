import { expect, test } from '@playwright/test';

async function open(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    window.audioEvidence = { contexts: [], oscillators: 0 };
    window.AudioContext = class extends NativeAudioContext {
      constructor() {
        super();
        window.audioEvidence.contexts.push(this);
      }
      createOscillator() {
        window.audioEvidence.oscillators++;
        return super.createOscillator();
      }
    };
  });
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
}

test('sound requires activation, reuses one context, suspends on mute and never writes learning records', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  const toggle = page.locator('#soundscape-toggle');
  await expect(toggle).toHaveAttribute('data-audio-state', 'uninitialized');
  expect(await page.evaluate(() => audioEvidence.contexts.length)).toBe(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-audio-state', 'running');
  await page.locator('#scene-controls summary').click();
  await page.locator('#soundscape-output').selectOption('speakers');
  await page.locator('#soundscape-output').selectOption('headphones');
  await page.locator('#soundscape-volume').fill('0');
  await page.locator('[data-sky-event="meteor"]').click();
  await page.locator('[data-sky-event="none"]').click();
  await page.locator('#scene-controls summary').click();
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-audio-state', 'suspended');
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-audio-state', 'running');
  expect(await page.evaluate(() => audioEvidence.contexts.length)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  expect(errors).toEqual([]);
});

test('durable creation, edit and deletion have distinct cues; duplicates and muted operations stay silent', async ({
  page,
}) => {
  await open(page);
  await page.locator('#soundscape-toggle').click();
  await expect(page.locator('#soundscape-toggle')).toHaveAttribute('data-audio-state', 'running');
  const oscillatorCount = () => page.evaluate(() => audioEvidence.oscillators);
  const original = await oscillatorCount();
  async function add(word) {
    if ((await page.locator('#detail-panel').getAttribute('aria-hidden')) === 'false')
      await page.locator('#close-detail').click();
    await page.locator('#open-add').click();
    await page.locator('#word-input').fill(word);
    await page.locator('#meaning-input').fill('Synthetic meaning');
    await page.locator('#word-form').evaluate((form) => form.requestSubmit());
  }
  await add('Luminous');
  await expect(page.locator('#detail-word')).toHaveText('Luminous');
  expect(await oscillatorCount()).toBe(original + 3);
  await page.locator('#edit-word').click();
  await page.locator('#meaning-input').fill('Updated synthetic meaning');
  await page.locator('#word-form').evaluate((form) => form.requestSubmit());
  expect(await oscillatorCount()).toBe(original + 5);
  await add('Luminous');
  await expect(page.locator('#form-error')).not.toBeEmpty();
  expect(await oscillatorCount()).toBe(original + 5);
  await page.locator('#add-panel .panel-close').click();
  await page.locator('#soundscape-toggle').click();
  await expect(page.locator('#soundscape-toggle')).toHaveAttribute('data-audio-state', 'suspended');
  await add('Ethereal');
  await expect(page.locator('#detail-word')).toHaveText('Ethereal');
  expect(await oscillatorCount()).toBe(original + 5);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#delete-word').click();
  await expect(page.locator('#detail-panel')).toHaveAttribute('aria-hidden', 'true');
  expect(await oscillatorCount()).toBe(original + 5);
  await page.locator('#soundscape-toggle').click();
  await expect(page.locator('#soundscape-toggle')).toHaveAttribute('data-audio-state', 'running');
  await page.locator('#collection-btn').click();
  await page.locator('.collection-item').filter({ hasText: 'Luminous' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#delete-word').click();
  await expect.poll(oscillatorCount).toBe(original + 7);
});

test('native offline synthesis has audible stereo energy, bounded peaks and a distinct birth cue', async ({ page }) => {
  await page.goto('/tests/fixtures/word-star-lab.html');
  const result = await page.evaluate(async () => {
    const { createSoundscapeGraph } = await import('/src/soundscape.js');
    async function render(birth) {
      const context = new OfflineAudioContext(2, 24000 * 5, 24000);
      const graph = createSoundscapeGraph(context);
      graph.update({ depth: 0.6 });
      graph.setVolume(1);
      if (birth) graph.birth();
      const buffer = await context.startRendering();
      graph.dispose();
      return [buffer.getChannelData(0), buffer.getChannelData(1)];
    }
    const bed = await render(false),
      born = await render(true);
    let sum = 0,
      stereo = 0,
      difference = 0,
      peak = 0;
    for (let i = 0; i < bed[0].length; i++) {
      sum += bed[0][i] ** 2;
      stereo += (bed[0][i] - bed[1][i]) ** 2;
      difference += (bed[0][i] - born[0][i]) ** 2;
      peak = Math.max(peak, Math.abs(born[0][i]), Math.abs(born[1][i]));
    }
    return {
      rms: Math.sqrt(sum / bed[0].length),
      stereo: Math.sqrt(stereo / bed[0].length),
      difference: Math.sqrt(difference / bed[0].length),
      peak,
    };
  });
  expect(result.rms).toBeGreaterThan(0.004);
  expect(result.stereo).toBeGreaterThan(0.001);
  expect(result.difference).toBeGreaterThan(0.001);
  expect(result.peak).toBeLessThan(0.8);
});

test('spatial birth cues localize left/right and a full-scale merger mix retains headroom', async ({ page }) => {
  await page.goto('/tests/fixtures/word-star-lab.html');
  const result = await page.evaluate(async () => {
    const { createSoundscapeGraph } = await import('/src/soundscape.js');
    async function render(position, event) {
      const context = new OfflineAudioContext(2, 24000 * (event ? 22 : 4), 24000),
        graph = createSoundscapeGraph(context);
      graph.setVolume(1);
      graph.update({ depth: 1, focused: true, event });
      if (position) graph.birth(position);
      if (event) graph.event(event);
      const buffer = await context.startRendering();
      graph.dispose();
      return [buffer.getChannelData(0), buffer.getChannelData(1)];
    }
    const bed = await render(),
      left = await render([-5, 1, -2]),
      right = await render([5, 1, -2]),
      merger = await render(null, 'kilonova');
    function energy(cue, c) {
      return cue[c].reduce((sum, s, i) => sum + (s - bed[c][i]) ** 2, 0);
    }
    let peak = 0,
      rms = 0;
    for (let i = 0; i < merger[0].length; i++)
      for (let c = 0; c < 2; c++) {
        peak = Math.max(peak, Math.abs(merger[c][i]));
        rms += merger[c][i] ** 2;
      }
    return {
      left: [energy(left, 0), energy(left, 1)],
      right: [energy(right, 0), energy(right, 1)],
      peak,
      rms: Math.sqrt(rms / (merger[0].length * 2)),
    };
  });
  expect(result.left[0]).toBeGreaterThan(result.left[1] * 1.1);
  expect(result.right[1]).toBeGreaterThan(result.right[0] * 1.1);
  expect(result.peak).toBeLessThan(0.6);
  expect(result.rms).toBeGreaterThan(0.01);
});
