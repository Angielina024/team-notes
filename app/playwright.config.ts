import { defineConfig, devices } from '@playwright/test';

try {
  process.loadEnvFile('.env');
} catch {
  // у CI файлу .env немає: змінні приходять з оточення
}

const isCI = !!process.env.CI; // GitHub Actions сам ставить CI=true

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  workers: 1,                 // нове: e2e ділять одну тестову базу
  forbidOnly: isCI,           // нове: забутий test.only валить CI
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: false,
    timeout: 120_000,         // нове: на повільній CI-машині збірка довша
    env: { DATABASE_URL: process.env.DATABASE_URL_TEST ?? '' },
  },
});
