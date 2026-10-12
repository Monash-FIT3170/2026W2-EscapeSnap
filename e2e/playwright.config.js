// Playwright end-to-end config. Lives in e2e/ (ignored by .meteorignore) so
// Meteor never bundles it. Run from the repo root with `meteor npm run test:e2e`.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 3000);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // Meteor's first build is slow, and every multiplayer test waits on DDP
  // round-trips between several browser contexts.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Tests share one Meteor server and database. Each test creates its own
  // game, so they don't interfere, but running serially keeps the single dev
  // server from being swamped and keeps failures easy to read.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report' }]],

  use: {
    baseURL: BASE_URL,
    // The app picks its language from navigator.language, so pin English or
    // the text-based selectors break on a non-English machine.
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `meteor run --port ${PORT}`,
    cwd: '..',
    url: BASE_URL,
    // Locally, reuse `meteor npm start` if it's already running; in CI always
    // start a fresh server.
    reuseExistingServer: !process.env.CI,
    // First Meteor build can take several minutes on a cold cache.
    timeout: 5 * 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      // Without a key the app falls back to its built-in riddle bank, so the
      // tests are fast, free and don't depend on Gemini being up.
      GEMINI_API_KEY: '',
    },
  },
});
