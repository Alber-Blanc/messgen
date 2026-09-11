import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      thresholds: {
        statements: 90,
        branches: 86,
        functions: 94,
        lines: 90,
      },
    },
  },
});
