'use client';

import { type JSX } from 'react';
import { useAuth } from '@clerk/react';
import { NotFoundScreen } from '@/components/not-found-screen';

/** Next 404 boundary — reuses the SPA's not-found screen. */
export default function NotFound(): JSX.Element {
  const { userId } = useAuth();
  return <NotFoundScreen signedIn={Boolean(userId)} />;
}
