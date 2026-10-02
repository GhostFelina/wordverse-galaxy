import { expect, test } from '@playwright/test';

test('guest can add a word and retain it after reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#open-add').click();
  await page.locator('#word-input').fill('luminous');
  await page.locator('#meaning-input').fill('ışık saçan');
  await page.locator('#submit-word').click();
  await expect(page.locator('#star-count')).toHaveText('01');
  await page.reload();
  await expect(page.locator('#star-count')).toHaveText('01');
  await page.locator('#collection-btn').click();
  await expect(page.locator('#collection-list')).toContainText('luminous');
});

test('about page opens', async ({ page }) => {
  await page.goto('/about.html');
  await expect(page).toHaveTitle(/Wordverse/);
});
