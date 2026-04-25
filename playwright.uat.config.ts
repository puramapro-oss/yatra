import { defineConfig, devices } from '@playwright/test'

const BASE = process.env.UAT_BASE_URL ?? 'https://yatra.purama.dev'

export default defineConfig({
  testDir: './tests/uat',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // tests are stateful (shared user)
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/uat/report' }]],
  outputDir: 'tests/uat/output',
  globalSetup: require.resolve('./tests/uat/_global-setup'),
  globalTeardown: require.resolve('./tests/uat/_global-teardown'),
  use: {
    baseURL: BASE,
    trace: 'on',
    screenshot: 'on',
    video: 'off',
    headless: true,
    viewport: { width: 1280, height: 900 },
    locale: 'fr-FR',
    geolocation: { latitude: 48.8566, longitude: 2.3522 }, // Paris
    permissions: ['geolocation'],
    bypassCSP: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
