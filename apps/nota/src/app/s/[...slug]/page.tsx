import type { JSX } from 'react';

import {
  fetchSharedNote,
  type SharedNote,
} from '@nota/data-source/note-share-client';

import { SharedNoteView } from '@/shared-note-view';

interface SharedNotePageProps {
  params: Promise<{ slug?: string[] }>;
}

/**
 * Public shared-note page (`/s/<token>`): read-only and unauthenticated.
 *
 * The note is read here, on the server, through the anon-safe `get_shared_note`
 * RPC, so the HTML already carries the note instead of a spinner waiting on a
 * browser round trip. Only the TipTap body is client-only (it suspends inside the
 * viewer); the viewer keeps the realtime subscription and refetches on every
 * broadcast, so live edits still land.
 */
export default async function SharedNotePage({
  params,
}: SharedNotePageProps): Promise<JSX.Element> {
  const { slug } = await params;
  // Next has already percent-decoded the segments; joining is enough.
  const token = (slug ?? []).join('/').replace(/\/+$/, '');

  let note: SharedNote | null = null;
  let loadError: string | null = null;

  if (token) {
    try {
      note = await fetchSharedNote(token);
    } catch (error) {
      loadError =
        error instanceof Error ? error.message : 'Something went wrong';
    }
  }

  return (
    <SharedNoteView token={token} initialNote={note} loadError={loadError} />
  );
}
