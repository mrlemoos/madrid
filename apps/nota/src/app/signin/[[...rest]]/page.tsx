'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/react';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { NotaClerkSignIn } from '@/components/nota-clerk-auth';
import { NotaLoadingStatus } from '@nota/web-design/spinner';
import { notaButtonVariants } from '@nota/web-design/button';
import { cn } from '@/lib/utils';

export default function SignInPage(): JSX.Element {
  const { isLoaded, userId } = useAuth();

  return (
    <AuthScreenShell
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className={cn(
              notaButtonVariants({ variant: 'link', size: 'sm' }),
              'h-auto p-0 text-sm',
            )}
          >
            Sign up
          </Link>
        </>
      }
    >
      {!isLoaded ? (
        <div className="py-8">
          <NotaLoadingStatus label="Loading…" spinnerSize="sm" />
        </div>
      ) : userId ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Opening Nota…
        </p>
      ) : (
        <NotaClerkSignIn />
      )}
    </AuthScreenShell>
  );
}
