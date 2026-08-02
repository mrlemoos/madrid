import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/note-capture-ui',
  test: {
    name: '@nota/note-capture-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    passWithNoTests: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
