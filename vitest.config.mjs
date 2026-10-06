import { defineConfig } from 'vitest/config';

// In CI, also write a JUnit report and a coverage summary so the workflow
// can publish them to the run summary page.
const isCI = Boolean(process.env.CI);

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['imports/ui/**/*.component.test.jsx'],
    restoreMocks: true,
    clearMocks: true,
    reporters: isCI ? ['default', 'junit'] : ['default'],
    outputFile: { junit: '.reports/vitest-junit.xml' },
    coverage: {
      enabled: isCI,
      provider: 'v8',
      include: ['imports/ui/**/*.{js,jsx}'],
      exclude: ['**/*.test.{js,jsx}'],
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: '.reports/coverage',
    },
  },
});
