import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Bound parallel WebGL contexts and cold Vite transforms on shared desktops.
  // Hosted runners use software WebGL. One GPU-heavy browser at a time keeps
  // storage/auth timing checks independent from another scene's shader compiler.
  workers: process.env.CI ? 1 : 2,
  use: { baseURL: process.env.WORDVERSE_BASE_URL || 'http://127.0.0.1:5350', browserName: 'chromium' },
  webServer: process.env.WORDVERSE_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        env: {
          VITE_SUPABASE_URL: 'https://wordverse-auth.test',
          VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
        },
        url: 'http://127.0.0.1:5350',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
