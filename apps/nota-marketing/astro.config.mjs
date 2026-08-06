// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: 'https://nota.mrlemoos.dev',
  integrations: [react(), sitemap()],
  vite: {
    envPrefix: ['VITE_', 'PUBLIC_'],
    plugins: [tailwindcss()],
    resolve: {
      conditions: ['@nota/source', 'import', 'module', 'browser', 'default'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },
});
