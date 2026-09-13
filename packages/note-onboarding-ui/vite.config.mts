import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ['@getmadrid/source'],
  },
  test: {
    name: '@getmadrid/note-onboarding-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    reporters: ['default'],
  },
});
