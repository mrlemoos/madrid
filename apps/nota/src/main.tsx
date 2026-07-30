import { createRoot } from 'react-dom/client';
/* Import via the JS graph so Vite emits `url(./files/*.woff2)` assets. `@import` inside
 * `styles.css` is handled only by PostCSS/Tailwind and does not attach font files to the bundle,
 * which left `/assets/files/*.woff2` missing in production (SPA rewrite returned HTML → OTS errors). */
import '@fontsource-variable/inter/index.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource-variable/source-serif-4/index.css';
import '@fontsource/geist-sans/latin.css';
import '@fontsource-variable/nunito/index.css';
import '../styles.css';
import { bootstrapAppNavigation } from './lib/app-navigation';
import { repairClerkAuthLocationHash } from './lib/clerk-hash-navigation';
import { NotaApp } from './app-root';
import { AppProviders } from './providers';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element');
}

/** Hash may not be visible on the first synchronous tick; re-run through the document lifecycle. */
repairClerkAuthLocationHash();
queueMicrotask(() => {
  repairClerkAuthLocationHash();
});
if (document.readyState !== 'loading') {
  repairClerkAuthLocationHash();
}
document.addEventListener(
  'DOMContentLoaded',
  () => {
    repairClerkAuthLocationHash();
  },
  { once: true },
);
window.addEventListener(
  'load',
  () => {
    repairClerkAuthLocationHash();
  },
  { once: true },
);

bootstrapAppNavigation();

createRoot(rootEl).render(
  <AppProviders>
    <NotaApp />
  </AppProviders>,
);
