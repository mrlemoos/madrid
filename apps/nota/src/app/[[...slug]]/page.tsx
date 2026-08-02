'use client';

import dynamic from 'next/dynamic';
import type { JSX } from 'react';

// The whole vault/editor SPA is client-only (browser storage, Clerk, GSAP).
// `ssr: false` keeps it out of the server render; a catch-all route preserves
// the existing hash navigation until path routing (ticket 03) lands.
const NotaClient = dynamic(() => import('../nota-client'), { ssr: false });

export default function Page(): JSX.Element {
  return <NotaClient />;
}
