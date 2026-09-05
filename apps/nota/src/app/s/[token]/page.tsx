import type { Metadata } from 'next';
import { cache, type JSX } from 'react';

import {
  fetchSharedNote,
  fetchSharedNoteAttachments,
  type SharedNote,
  type SharedNoteAttachment,
} from '@getmadrid/data-source/note-share-client';
import { buildSharedNoteMeta } from '@getmadrid/note-share-og/meta';

import { SharedNoteView } from '@/shared-note-view';

interface SharedNotePageProps {
  params: Promise<{ token: string }>;
}

/**
 * Title/excerpt/banner can lag a live edit by up to this long. Unfurl clients
 * cache previews for far longer than we do, so paying for a fresh RPC + Satori
 * render on every crawler hit buys nothing.
 */
export const revalidate = 300;

/**
 * One RPC per request shared by `generateMetadata` and the page. `cache()` is
 * required here: `fetchSharedNote` goes through supabase-js, not `fetch`, so
 * Next has no request-level dedupe of its own to lean on.
 */
export const loadSharedNote = cache(
  async (token: string): Promise<SharedNote | null> => {
    if (!token) {
      return null;
    }
    return await fetchSharedNote(token);
  },
);

export async function generateMetadata({
  params,
}: SharedNotePageProps): Promise<Metadata> {
  const { token } = await params;
  let note: SharedNote | null = null;
  try {
    note = await loadSharedNote(token);
  } catch {
    // Never throw from metadata: a Supabase blip would 500 the whole page
    // instead of letting the view render its own load-error state.
  }

  const { title, description } = buildSharedNoteMeta(note);
  return {
    title,
    ...(description ? { description } : {}),
    // Link-preview bots ignore `noindex` -- unfurls still work -- but search
    // engines stay out. Share tokens are permanent and cannot be revoked, so an
    // indexed note would be public forever.
    robots: { index: false, follow: false },
    openGraph: {
      type: 'article',
      siteName: 'Madrid',
      title,
      ...(description ? { description } : {}),
    },
    twitter: { card: 'summary_large_image', title },
  };
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
  // Single segment, not a catch-all: tokens are hex (`generateShareToken`), and
  // Next forbids metadata image files under a catch-all route.
  const { token } = await params;

  let note: SharedNote | null = null;
  let attachments: SharedNoteAttachment[] = [];
  let loadError: string | null = null;

  if (token) {
    try {
      note = await loadSharedNote(token);
    } catch (error) {
      loadError =
        error instanceof Error ? error.message : 'Something went wrong';
    }
    if (note) {
      try {
        attachments = await fetchSharedNoteAttachments(token);
      } catch {
        // Non-fatal: the note still reads fine, individual attachment nodes
        // render their own unavailable state.
      }
    }
  }

  return (
    <SharedNoteView
      token={token}
      initialNote={note}
      initialAttachments={attachments}
      loadError={loadError}
    />
  );
}
