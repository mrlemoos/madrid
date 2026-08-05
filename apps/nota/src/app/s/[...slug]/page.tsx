'use client';

import dynamic from 'next/dynamic';
import type { JSX } from 'react';

// Public shared-note view (`/s/<token>`): read-only, unauthenticated, browser-only
// (reuses the TipTap editor + Supabase realtime). Kept out of the server render.
const SharedNoteView = dynamic(
  () => import('@/shared-note-view').then((m) => m.SharedNoteView),
  { ssr: false },
);

export default function SharedNotePage(): JSX.Element {
  return <SharedNoteView />;
}
