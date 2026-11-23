import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const port = process.env.YATRA_ALERTS_UI_PORT ?? '3137'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)

export default defineConfig({
  testDir: '.', testMatch: 'alertes-ui.spec.ts', fullyParallel: false, workers: 1,
  timeout: 30_000, expect: { timeout: 8000 }, reporter: 'line',
  outputDir: process.env.YATRA_ALERTS_UI_ARTIFACTS ?? path.join(tmpdir(), 'yatra-alertes-ui-results'),
  use: {
    baseURL: `http://127.0.0.1:${port}`, browserName: 'chromium', locale: 'fr-FR',
    viewport: { width: 1280, height: 900 }, contextOptions: { reducedMotion: 'reduce' },
    launchOptions: { executablePath }, screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/vacances/alertes-ui-harness.mjs', url: `http://127.0.0.1:${port}`,
    cwd: path.resolve(__dirname, '../..'), reuseExistingServer: false, timeout: 120_000,
  },
})
