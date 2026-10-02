import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: process.env.WORDVERSE_BASE_URL || 'http://127.0.0.1:5350', browserName: 'chromium' },
  webServer: process.env.WORDVERSE_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5350',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
