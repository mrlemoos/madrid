'use client';

import type { JSX } from 'react';
import { useAuth } from '@clerk/react';
import { NotaClerkSignIn } from '@/components/nota-clerk-auth';
import { LoadingStatus } from '@nota/design/spinner';

/** `/signin` — the Clerk sign-in form (chrome + footer come from the (auth) layout). */
export default function SignInPage(): JSX.Element {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="py-8">
        <LoadingStatus label="Loading…" spinnerSize="sm" />
      </div>
    );
  }
  if (userId) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Opening Nota…
      </p>
    );
  }
  return <NotaClerkSignIn />;
}
