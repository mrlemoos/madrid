'use client';

import type { JSX } from 'react';
import { useAuth } from '@clerk/react';
import { NotaClerkSignUp } from '@/components/nota-clerk-auth';
import { LoadingStatus } from '@getmadrid/design/spinner';

/** `/signup` — the Clerk sign-up form (chrome + footer come from the (auth) layout). */
export default function SignUpPage(): JSX.Element {
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
        Opening Madrid…
      </p>
    );
  }
  return <NotaClerkSignUp />;
}
