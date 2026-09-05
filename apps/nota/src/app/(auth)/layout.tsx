'use client';

import { useRef, type JSX, type ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@getmadrid/design/card';
import {
  SignedOutStage,
  signedOutCardClass,
} from '@/components/signed-out-stage';
import { useAuthCardOriginMorph } from '@/lib/use-auth-card-origin-morph';
import { cn } from '@/lib/utils';

/**
 * Shared chrome for `/signin` + `/signup` (the `(auth)` group). The Clerk form is
 * the route `children`; `@header` is the Grotesque card title (`@header/signin`,
 * `@header/signup`); the "switch to sign in/up" prompt is `@footer`.
 */
export default function AuthLayout({
  children,
  footer,
  header,
}: {
  children: ReactNode;
  footer: ReactNode;
  header?: ReactNode;
}): JSX.Element {
  const shellRef = useRef<HTMLDivElement>(null);
  useAuthCardOriginMorph(shellRef);

  return (
    <SignedOutStage>
      <div
        ref={shellRef}
        className="t-modal t-resize is-open nota-auth-card-enter"
      >
        <Card className={cn(signedOutCardClass)}>
          {header ? <CardHeader className="pb-0">{header}</CardHeader> : null}
          <CardContent className={header ? undefined : 'pt-6'}>
            <div className="nota-auth-form-slot w-full">{children}</div>
          </CardContent>
          <CardFooter className="justify-center border-t border-border/40 pt-4">
            <p className="text-center text-muted-foreground text-xs/relaxed">
              {footer}
            </p>
          </CardFooter>
        </Card>
      </div>
    </SignedOutStage>
  );
}
