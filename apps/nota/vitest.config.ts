/// <reference types='vitest' />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Standalone Vitest config (the app builds with Next now; this replaces the
// test half of the former vite.config.mts). No React plugin — esbuild's
// automatic JSX runtime is enough for specs and avoids "React is not defined".
const srcDir = path.join(fileURLToPath(new URL('.', import.meta.url)), 'src');

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    // Compile workspace `@nota/*` libraries from their TS source, like the app.
    conditions: ['@nota/source', 'import', 'module', 'browser', 'default'],
    dedupe: ['@clerk/shared', 'react', 'react-dom'],
    alias: [
      { find: '~', replacement: srcDir },
      { find: '@', replacement: srcDir },
    ],
  },
  esbuild: { jsx: 'automatic' },
  ssr: { noExternal: ['gsap', '@gsap/react', 'motion'] },
  test: {
    name: '@nota/nota',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.spec.mjs',
    ],
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
});
