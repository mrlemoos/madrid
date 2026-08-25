import type { JSX, ReactNode } from 'react';
import { CardDescription } from '@nota/design/card';
import { bricolageGrotesqueStyle } from '@/components/bricolage-grotesque';

/** Display title inside the signed-out form card (`/signin`, `/signup`). */
export function AuthCardTitle({
  children,
  description,
}: {
  children: ReactNode;
  description: string;
}): JSX.Element {
  return (
    <>
      <h2
        className="text-balance text-2xl font-medium leading-tight tracking-tight text-foreground"
        style={bricolageGrotesqueStyle}
      >
        {children}
      </h2>
      <CardDescription className="sr-only">{description}</CardDescription>
    </>
  );
}
