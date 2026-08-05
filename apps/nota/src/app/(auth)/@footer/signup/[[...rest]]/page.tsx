import type { JSX } from 'react';
import Link from 'next/link';
import { notaButtonVariants } from '@nota/web-design/button';
import { cn } from '@/lib/utils';

/** `@footer` slot for `/signup` — prompt to switch to sign in. */
export default function SignUpFooter(): JSX.Element {
  return (
    <>
      Already have an account?{' '}
      <Link
        href="/signin"
        className={cn(
          notaButtonVariants({ variant: 'link', size: 'sm' }),
          'h-auto p-0 text-sm',
        )}
      >
        Sign in
      </Link>
    </>
  );
}
