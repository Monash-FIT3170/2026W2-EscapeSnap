import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['imports/ui/**/*.component.test.jsx'],
    restoreMocks: true,
    clearMocks: true,
  },
});
