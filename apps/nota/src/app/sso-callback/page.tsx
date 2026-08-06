'use client';

import type { JSX } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/react';
import { LoadingStatus } from '@nota/design/spinner';

/**
 * OAuth landing route (`/sso-callback`): mounts the captcha target and Clerk's
 * `handleRedirectCallback` (see Clerk OAuth custom-flow docs) while showing the
 * signing-in frame.
 */
export default function SsoCallbackPage(): JSX.Element {
  return (
    <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
      <div id="clerk-captcha" />
      <AuthenticateWithRedirectCallback
        signInUrl="/signin"
        signUpUrl="/signup"
      />
      <LoadingStatus label="Signing you in…" />
    </div>
  );
}
