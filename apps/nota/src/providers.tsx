import { ClerkProvider } from '@clerk/react';
import { ui } from '@clerk/ui';
import { StrictMode, type ReactNode } from 'react';
import { DeferredPostHogRoot } from './components/deferred-posthog-root';
import { AppErrorBoundary } from './components/app-error-boundary';
import { ThemeProvider } from '@nota/web-design/theme';
import { ClerkSupabaseBridge } from '@nota/note-runtime/clerk-supabase-bridge';
import { NoteEditorCommandsProvider } from '@nota/editor';
import { StickyDocTitleProvider } from '@nota/note-runtime/sticky-doc-title';
import { AppSessionProvider } from '@nota/note-runtime/session-context';
import {
  clerkFullNotesUrl,
  clerkFullSignInUrl,
  clerkFullSignUpUrl,
  clerkRouterPush,
  clerkRouterReplace,
} from '@nota/app-navigation-core/clerk-hash';
import { ClerkSsoCallbackRoute } from './components/clerk-sso-callback-route';
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
  if (!clerkPublishableKey) {
    throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider
      ui={ui}
      publishableKey={clerkPublishableKey}
      signInUrl={clerkFullSignInUrl()}
      signUpUrl={clerkFullSignUpUrl()}
      signInForceRedirectUrl={clerkFullNotesUrl()}
      signUpForceRedirectUrl={clerkFullNotesUrl()}
      routerPush={clerkRouterPush}
      routerReplace={clerkRouterReplace}
      allowedRedirectProtocols={['nota:']}
    >
      <StrictMode>
        <DeferredPostHogRoot apiKey={POSTHOG_PROJECT_TOKEN}>
          <ClerkSupabaseBridge>
            <ClerkSsoCallbackRoute />
            <ThemeProvider defaultTheme="system" storageKey="nota-ui-theme">
              <AppSessionProvider>
                <StickyDocTitleProvider>
                  <NoteEditorCommandsProvider>
                    <AppErrorBoundary>{children}</AppErrorBoundary>
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
