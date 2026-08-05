'use client';

import type { JSX } from 'react';
import { NotaLoadingStatus } from '@nota/web-design/spinner';

/**
 * OAuth landing route (`/sso-callback`). The actual Clerk handshake
 * (`AuthenticateWithRedirectCallback`) is mounted by `ClerkSsoCallbackRoute`
 * inside the app providers for this pathname; this page just holds the frame.
 */
export default function SsoCallbackPage(): JSX.Element {
  return (
    <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
      <NotaLoadingStatus label="Signing you in…" />
    </div>
  );
}
