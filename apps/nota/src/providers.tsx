'use client';

import { ClerkProvider } from '@clerk/react';
import { ui } from '@clerk/ui';
import { useRouter } from 'next/navigation';
import { StrictMode, useEffect, type ReactNode } from 'react';
import { setAppRouterNav } from '@nota/app-navigation-core/navigation';
import { DeferredPostHogRoot } from './components/deferred-posthog-root';
import { ErrorBoundary } from '@nota/error-boundary/error-boundary';
import { ThemeProvider } from '@nota/design/theme';
import { ClerkSupabaseBridge } from '@nota/note-runtime/clerk-supabase-bridge';
import { NoteEditorCommandsProvider } from '@nota/editor';
import { StickyDocTitleProvider } from '@nota/note-runtime/sticky-doc-title';
import { AppSessionProvider } from '@nota/note-runtime/session-context';
import { viteEnvString } from './lib/vite-env';

const POSTHOG_PROJECT_TOKEN = viteEnvString(
  'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN',
);
const clerkPublishableKey =
  viteEnvString('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')?.trim() ?? '';

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

  if (!clerkPublishableKey) {
    throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider
      ui={ui}
      publishableKey={clerkPublishableKey}
      signInUrl="/signin"
      signUpUrl="/signup"
      // Path routing: post-auth lands on the real `/notes` route (auth-gated by
      // the (protected) layout). Relative so it renders on the server too.
      signInForceRedirectUrl="/notes"
      signUpForceRedirectUrl="/notes"
      routerPush={(to) => {
        router.push(to);
      }}
      routerReplace={(to) => {
        router.replace(to);
      }}
      allowedRedirectProtocols={['nota:']}
    >
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
    </ClerkProvider>
  );
}
