/// <reference types='vitest' />
import * as path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

const root = import.meta.dirname;

const libEntries = {
  button: path.join(root, 'src/components/button.tsx'),
  card: path.join(root, 'src/components/card.tsx'),
  tooltip: path.join(root, 'src/components/tooltip.tsx'),
  'context-menu': path.join(root, 'src/components/context-menu.tsx'),
  'hover-card': path.join(root, 'src/components/hover-card.tsx'),
  dialog: path.join(root, 'src/components/dialog.tsx'),
  'flight-globe': path.join(root, 'src/components/flight-globe.tsx'),
  spinner: path.join(root, 'src/components/spinner.tsx'),
  'nota-tint-circle': path.join(root, 'src/components/nota-tint-circle.tsx'),
  utils: path.join(root, 'src/lib/utils.ts'),
  theme: path.join(root, 'src/lib/theme.tsx'),
  'theme-color': path.join(root, 'src/lib/theme-color.ts'),
  'motion-tokens': path.join(root, 'src/lib/motion-tokens.ts'),
  'popup-motion': path.join(root, 'src/lib/nota-popup-motion.ts'),
  icon: path.join(root, 'src/components/icon.tsx'),
  icons: path.join(root, 'src/icons/index.ts'),
} as const;

export default defineConfig(() => ({
  root,
  cacheDir: '../../node_modules/.vite/packages/design',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(root, 'tsconfig.lib.json'),
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: libEntries,
      formats: ['es' as const],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rolldownOptions: {
      external: (id) =>
        id === 'react' ||
        id === 'react-dom' ||
        id === 'react/jsx-runtime' ||
        id === 'clsx' ||
        id === 'tailwind-merge' ||
        id === 'class-variance-authority' ||
        id === '@getmadrid/helper-hooks' ||
        id.startsWith('react/') ||
        id.startsWith('@base-ui/') ||
        id.startsWith('@getmadrid/helper-hooks/') ||
        id === 'motion/react' ||
        id.startsWith('motion/'),
    },
  },
  test: {
    name: '@getmadrid/design',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
