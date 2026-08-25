'use client';

import { useEffect, StrictMode, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setAppRouterNav } from '@nota/app-navigation-core/navigation';
import { DeferredPostHogRoot } from './components/deferred-posthog-root';
import { ErrorBoundary } from '@nota/error-boundary/error-boundary';
import { ThemeProvider } from '@nota/design/theme';
import { ClerkSupabaseBridge } from '@nota/note-runtime/clerk-supabase-bridge';
import { NoteEditorCommandsProvider } from '@nota/editor';
import { StickyDocTitleProvider } from '@nota/note-runtime/sticky-doc-title';
import { AppSessionProvider } from '@nota/note-runtime/session-context';
import { AuthProvider } from './auth';
import { env } from '@nota/env-nextjs';

const POSTHOG_PROJECT_TOKEN = env('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN');

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const router = useRouter();

  // Bridge Next's router into the imperative nav helpers (navigateToScreen/replaceScreen).
  // Without this they fall back to shallow `history.pushState`, which does not render
  // a different route segment in the App Router.
  useEffect(() => {
    setAppRouterNav({
      push: (href) => {
        router.push(href);
      },
      replace: (href) => {
        router.replace(href);
      },
    });
    return () => {
      setAppRouterNav(null);
    };
  }, [router]);

  return (
    <AuthProvider>
      <StrictMode>
        <DeferredPostHogRoot apiKey={POSTHOG_PROJECT_TOKEN}>
          <ClerkSupabaseBridge>
            <ThemeProvider defaultTheme="system" storageKey="nota-ui-theme">
              <AppSessionProvider>
                <StickyDocTitleProvider>
                  <NoteEditorCommandsProvider>
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </NoteEditorCommandsProvider>
                </StickyDocTitleProvider>
              </AppSessionProvider>
            </ThemeProvider>
          </ClerkSupabaseBridge>
        </DeferredPostHogRoot>
      </StrictMode>
    </AuthProvider>
  );
}
