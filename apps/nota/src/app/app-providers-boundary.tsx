'use client';

import { useEffect, useState, type ReactNode, type JSX } from 'react';
import { AppProviders } from '@/providers';

/**
 * Client-only providers boundary for every route. Renders nothing on the server
 * / first paint, then mounts the app providers (Clerk, theme, session, …) in the
 * browser — the SPA depends on browser APIs and must not server-render.
 */
export function AppProvidersBoundary({
  children,
}: {
  children: ReactNode;
}): JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null;
  }
  return <AppProviders>{children}</AppProviders>;
}
