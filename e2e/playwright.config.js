// Playwright end-to-end config. Lives in e2e/ (ignored by .meteorignore) so
// Meteor never bundles it. Run from the repo root with `meteor npm run test:e2e`.
import { defineConfig, devices } from '@playwright/test';
import { DEMO, DEMO_SLOW_MO, HOST_VIEWPORT } from './helpers/demo';

const PORT = Number(process.env.E2E_PORT || 3000);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // Meteor's first build is slow, and every multiplayer test waits on DDP
  // round-trips between several browser contexts.
  // Presentation mode is deliberately slow, so give it far more headroom.
  timeout: DEMO ? 10 * 60_000 : 60_000,
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
    // Demo runs always keep a trace and video so they can be replayed from
    // the report afterwards (player videos are attached by closePlayers).
    trace: DEMO ? 'on' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: DEMO ? 'on' : 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(DEMO && { headless: false, viewport: HOST_VIEWPORT }),
        launchOptions: {
          slowMo: DEMO ? DEMO_SLOW_MO : 0,
          // Chrome's built-in fake webcam (a moving test pattern), with the
          // permission prompt auto-accepted, so the player camera screen works.
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
      },
    },
  ],

  webServer: {
    command: `meteor run --port ${PORT}`,
    cwd: '..',
    url: BASE_URL,
    // Always start a fresh server: a dev server started with `meteor npm start`
    // wouldn't have the test env below. Stop it before running the tests.
    reuseExistingServer: false,
    // First Meteor build can take several minutes on a cold cache.
    timeout: 5 * 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      // Without a key the app falls back to its built-in riddle bank, so the
      // tests are fast, free and don't depend on Gemini being up.
      GEMINI_API_KEY: '',
      // Every photo is marked correct without calling Gemini (see
      // server/main.js). Has no effect on production builds.
      E2E_FAKE_CLASSIFY: 'pass',
    },
  },
});
