import type { JSX, ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Server-side auth gate for every route in the `(protected)` group (the notes
 * workspace). Resource-based protection — checked here where the data is served,
 * not via deprecated middleware path matching. Signed-out visitors go to sign-in.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/signin');
  }
  return <>{children}</>;
}
