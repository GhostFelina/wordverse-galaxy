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

test('a saved word sounds once; duplicate, edit and muted creation do not play a birth cue', async ({ page }) => {
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
  expect(await oscillatorCount()).toBe(original + 3);
  await add('Luminous');
  await expect(page.locator('#form-error')).not.toBeEmpty();
  expect(await oscillatorCount()).toBe(original + 3);
  await page.locator('#add-panel .panel-close').click();
  await page.locator('#soundscape-toggle').click();
  await expect(page.locator('#soundscape-toggle')).toHaveAttribute('data-audio-state', 'suspended');
  await add('Ethereal');
  await expect(page.locator('#detail-word')).toHaveText('Ethereal');
  expect(await oscillatorCount()).toBe(original + 3);
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
