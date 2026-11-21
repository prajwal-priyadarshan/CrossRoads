import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    environment: 'node',
    // Dummy values for the required env vars, so unit tests never need a database or a local .env
    setupFiles: ['test/setup.ts'],
  },
});
