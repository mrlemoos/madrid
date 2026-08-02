'use client';

import { useEffect, useState, type JSX } from 'react';
import { bootstrapAppNavigation } from '@nota/app-navigation-core/navigation';
import { repairClerkAuthLocationHash } from '@nota/app-navigation-core/clerk-hash';
import { SHARED_NOTE_PATH_PREFIX } from '@nota/data-source/note-share-client';
import { SharedNoteView } from '@/shared-note-view';
import { NotaApp } from '@/app-root';

/**
 * Client entry for the SPA under Next App Router. Loaded with `ssr: false`, so
 * browser-only bootstrap (Clerk hash repair, hash navigation, IndexedDB) runs
 * only in the browser — the former Vite `main.tsx` responsibility.
 *
 * Path routing (ticket 03) replaces the hash + pathname branching here; for the
 * skeleton the existing hash SPA is rendered verbatim.
 */
export default function NotaClient(): JSX.Element {
  const [isSharedNote] = useState(() =>
    window.location.pathname.startsWith(SHARED_NOTE_PATH_PREFIX),
  );

  useEffect(() => {
    if (isSharedNote) {
      return;
    }
    repairClerkAuthLocationHash();
    queueMicrotask(() => {
      repairClerkAuthLocationHash();
    });
    bootstrapAppNavigation();
  }, [isSharedNote]);

  // Public shared-note page: standalone, unauthenticated read-only view.
  if (isSharedNote) {
    return <SharedNoteView />;
  }

  return <NotaApp />;
}
