import { defineConfig } from '@playwright/test';

// Installability and offline behaviour need the production build and its
// generated service worker, so these checks run against `vite preview`.
export default defineConfig({
  testDir: './e2e-pwa',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5361', browserName: 'chromium', serviceWorkers: 'allow' },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 5361 --strictPort',
    url: 'http://127.0.0.1:5361',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
