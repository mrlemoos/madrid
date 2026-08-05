import type { VariantProps } from 'class-variance-authority';
import type { JSX, ReactNode } from 'react';
import Link from 'next/link';
import { notaButtonVariants } from '@nota/design/button';
import { authPathnameForScreenKind } from '@nota/app-navigation-core/auth';
import { cn } from '@/lib/utils';

type AuthHashTarget = 'login' | 'signup';

type AuthScreenHashLinkButtonProps = Pick<
  VariantProps<typeof notaButtonVariants>,
  'variant' | 'size'
>;

/**
 * Styled link to a Clerk auth route (`/signin` / `/signup`). A real `next/link` — the
 * earlier imperative variant issued `history.replaceState`, which Next treats as a
 * shallow URL update (no route change), so the click never navigated.
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
  const href = authPathnameForScreenKind(target);

  return (
    <Link
      href={href}
      className={cn(
        notaButtonVariants({ variant, size }),
        variant === 'link' ? 'h-auto p-0 text-sm' : undefined,
        className,
      )}
    >
      {children}
    </Link>
  );
}
