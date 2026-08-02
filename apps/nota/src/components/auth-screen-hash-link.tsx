import type { VariantProps } from 'class-variance-authority';
import type { JSX, ReactNode } from 'react';
import { notaButtonVariants } from '@nota/web-design/button';
import {
  replaceAppHash,
  type AppNavScreen,
} from '@nota/app-navigation-core/navigation';
import { authPathnameForScreenKind } from '@nota/app-navigation-core/auth';
import { cn } from '@/lib/utils';

type AuthHashTarget = 'login' | 'signup';

type AuthScreenHashLinkButtonProps = Pick<
  VariantProps<typeof notaButtonVariants>,
  'variant' | 'size'
>;

/**
 * Same-tab navigation for auth screens. Auth uses pathname (`/sign-in`) so Clerk path routing
 * works; `replaceAppHash` clears `#/…` hashes that would block `<SignIn />` from mounting.
 */
export function AuthScreenHashLink({
  target,
  className,
  children,
  variant = 'link',
  size = 'sm',
}: {
  target: AuthHashTarget;
  className?: string;
  children: ReactNode;
} & AuthScreenHashLinkButtonProps): JSX.Element {
  const screen: AppNavScreen =
    target === 'login'
      ? ({ kind: 'login' } as const)
      : ({ kind: 'signup' } as const);
  const href = authPathnameForScreenKind(screen.kind);

  return (
    <a
      href={href}
      className={cn(
        notaButtonVariants({ variant, size }),
        variant === 'link' ? 'h-auto p-0 text-sm' : undefined,
        className,
      )}
      onClick={(e) => {
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }
        e.preventDefault();
        replaceAppHash(screen);
      }}
    >
      {children}
    </a>
  );
}
