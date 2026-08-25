import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from '@/providers';

// Fonts via the JS graph (Next bundles the woff2 assets), matching the former
// Vite `main.tsx` imports. Order preserved.
import '@fontsource-variable/inter/index.css';
import '@fontsource-variable/bricolage-grotesque/index.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource-variable/source-serif-4/index.css';
import '@fontsource/geist-sans/latin.css';
import '@fontsource-variable/nunito/index.css';
import '../../styles.css';

export const metadata: Metadata = {
  // Absolute base for OG/Twitter image URLs; relative ones would resolve against
  // localhost. Mirrors the prod origin `shareOrigin()` falls back to.
  metadataBase: new URL('https://app.nota.mrlemoos.dev'),
  title: 'Nota',
  description: 'Offline-first notes.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
