import type { JSX } from 'react';
import Link from 'next/link';
import { notaButtonVariants } from '@nota/design/button';
import { cn } from '@/lib/utils';

/** `@footer` slot for `/signin` — prompt to switch to sign up. */
export default function SignInFooter(): JSX.Element {
  return (
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
  );
}
