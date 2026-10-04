import { test, expect } from '@playwright/test';
// Sample real camera progress promptly; assertions and the 30s gate stay unchanged.
const motion = (read) => expect.poll(read, { intervals: [50, 100, 150] });
for (const width of [1440, 768, 390]) {
  test(`Orion only with right-hand framing at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto('/?lang=tr');
    const canvas = page.locator('#universe');
    await expect(canvas).toHaveAttribute('data-nebula-loaded', '1');
    await expect(canvas).toHaveAttribute('data-nebula-ready', 'true');
    await expect(canvas).toHaveAttribute('data-nebulae', '1');
    await expect(canvas).toHaveAttribute('data-nebula-field-sources', '0');
    await expect(canvas).toHaveAttribute('data-nebula-bright-stars', '0');
    await expect(canvas).toHaveAttribute('data-nebula-width', '0.85');
    const raw = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await page.locator('#open-nebulae').click();
    await expect(page.locator('.nebula-card')).toHaveCount(1);
    await expect(page.locator('.nebula-card h3')).toHaveText('Orion Nebulası');
    await page.locator('#nebula-overview').click();
    await motion(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
    await expect(canvas).toHaveAttribute('data-nebula-refined', 'true');
    await expect(canvas).toHaveAttribute('data-nebula-gas-resolution', `${width}x900`);
    for (const layer of ['asteroids', 'fireballs', 'galaxies'])
      await expect(canvas).toHaveAttribute(`data-${layer}`, '0');
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(raw);
    if (width === 1440) await page.screenshot({ path: 'docs/handoff/evidence/upgrade/orion-home-1440.png' });
    expect(errors).toEqual([]);
  });
}
test('slower wheel and zoom controls fly through Orion and back; drag and data stay isolated', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/?lang=en');
  const canvas = page.locator('#universe');
  await expect(canvas).toHaveAttribute('data-nebula-loaded', '1');
  await expect(canvas).toHaveAttribute('data-nebula-ready', 'true');
  const raw = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('#open-nebulae').click();
  await page.mouse.move(650, 450);
  await page.mouse.wheel(0, -600);
  expect(Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
  await page.locator('[data-nebula="orion"]').click();
  await expect(page.locator('#nebula-dialog')).not.toBeVisible();
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, -160);
  // Chromium may coalesce back-to-back wheel inputs into one capped impulse.
  // Observe the first real camera movement before sending the next gesture.
  await motion(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(150);
  await page.mouse.wheel(0, -160);
  await expect(canvas).toHaveAttribute('data-inside-nebula', 'orion');
  await expect(canvas).toHaveAttribute('data-nebula-texture-resolution', '1254');
  const entryZ = Number(await canvas.getAttribute('data-camera-z'));
  expect(Number(await canvas.getAttribute('data-nebula-travel-length'))).toBeGreaterThan(2400);
  const before = Number(await canvas.getAttribute('data-camera-x'));
  await page.mouse.down();
  await page.mouse.move(755, 470, { steps: 4 });
  await page.mouse.up();
  await motion(async () => Math.abs(Number(await canvas.getAttribute('data-camera-x')) - before)).toBeGreaterThan(5);
  // Four discrete zoom controls cover the long cruise; slowed wheel still
  // checks continuous travel at every step without raising the 30s gate.
  for (let i = 0; i < 4; i++) await page.locator('#zoom-in').click();
  await page.mouse.move(720, 450);
  for (let i = 0; i < 14; i++) {
    const previousZ = Number(await canvas.getAttribute('data-camera-z'));
    await page.mouse.wheel(0, -214);
    await motion(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(previousZ - 5);
    if (i === 7) {
      await motion(async () => entryZ - Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(1300);
      await expect(canvas).toHaveAttribute('data-inside-nebula', 'orion');
    }
  }
  for (let i = 0; i < 2; i++) await page.locator('#zoom-in').click();
  await expect(canvas).toHaveAttribute('data-inside-nebula', '');
  const backZ = Number(await canvas.getAttribute('data-nebula-back-z'));
  await motion(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(backZ);
  await motion(async () =>
    Math.abs(
      Number(await canvas.getAttribute('data-camera-z')) - Number(await canvas.getAttribute('data-camera-target-z')),
    ),
  ).toBeLessThan(3);
  await page.mouse.move(720, 450);
  for (let i = 0; i < 15; i++) {
    const z = Number(await canvas.getAttribute('data-camera-z'));
    await page.mouse.wheel(0, 180);
    await motion(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(z + 1);
  }
  await expect(canvas).toHaveAttribute('data-inside-nebula', 'orion');
  for (let i = 0; i < 12; i++) await page.locator('#zoom-out').click();
  await motion(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(100);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(raw);
  expect(errors).toEqual([]);
});
