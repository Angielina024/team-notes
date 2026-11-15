import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

try {
  process.loadEnvFile('.env'); // DATABASE_URL_TEST з .env
} catch {
  // у CI файлу .env немає: змінні приходять з оточення
}

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: false,
    env: { DATABASE_URL: process.env.DATABASE_URL_TEST ?? '' },
  },
});