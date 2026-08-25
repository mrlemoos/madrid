'use client';

import type { JSX } from 'react';
import { cn } from '@/lib/utils';
import { electronWindowDragClasses } from '@nota/electron-bridge-core/window-chrome';
import { AuthScreenHashLink } from '@/components/auth-screen-hash-link';
import { SignedOutStage } from '@/components/signed-out-stage';
import { captureAuthCardOrigin } from '@/lib/auth-card-origin';

export function LandingPage(): JSX.Element {
  const { noDrag } = electronWindowDragClasses();

  return (
    <SignedOutStage contentClassName="contents">
      <div
        data-nota-landing-cta
        className={cn(
          noDrag,
          'absolute z-10 flex w-max max-w-[min(100%,20rem)] flex-col items-end gap-2.5',
          'right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1.5rem,env(safe-area-inset-bottom))]',
          'sm:right-8 sm:bottom-8',
        )}
      >
        <p className="text-right text-sm/relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
          New here?{' '}
          <AuthScreenHashLink
            target="signup"
            className="h-auto p-0 text-sm text-white underline underline-offset-4 hover:text-white"
          >
            Create an account
          </AuthScreenHashLink>
        </p>
        <AuthScreenHashLink
          target="login"
          variant="default"
          size="lg"
          className="h-10 touch-manipulation justify-center px-4 text-center text-base"
          onClick={(event) => {
            captureAuthCardOrigin(event.currentTarget);
          }}
        >
          Continue with email
        </AuthScreenHashLink>
      </div>
    </SignedOutStage>
  );
}
