'use client';

import { ClerkProvider } from '@clerk/react';
import { ui } from '@clerk/ui';
import { useRouter } from 'next/navigation';
import type { JSX, ReactNode } from 'react';
import { env } from '@getmadrid/env-nextjs';

type AuthProviderProps = {
  children: ReactNode;
};

const clerkAuthLocalization = {
  formButtonPrimary: 'Continue',
} as const;

/**
 * App-wide Clerk provider: path-routed sign-in/up, post-auth `/notes`, and
 * `nota:` deep-link redirects for the Mac shell.
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const router = useRouter();
  const publishableKey = env('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')?.trim() ?? '';

  if (!publishableKey) {
    throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider
      ui={ui}
      publishableKey={publishableKey}
      signInUrl="/signin"
      signUpUrl="/signup"
      // Path routing: post-auth lands on the real `/notes` route (auth-gated by
      // the (protected) layout). Relative so it renders on the server too.
      signInForceRedirectUrl="/notes"
      signUpForceRedirectUrl="/notes"
      localization={clerkAuthLocalization}
      routerPush={(to) => {
        router.push(to);
      }}
      routerReplace={(to) => {
        router.replace(to);
      }}
      allowedRedirectProtocols={['nota:']}
    >
      {children}
    </ClerkProvider>
  );
}
