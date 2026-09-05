import type { SupabaseClient } from '@supabase/supabase-js';

import { env } from '@getmadrid/env-nextjs';
import { getSupabaseAnonClient } from './supabase/anon';

/** Path prefix for the public shared-note page (matched in `main.tsx`). */
export const SHARED_NOTE_PATH_PREFIX = '/s/';

/**
 * Origin that owns the hosted web app. Share links must point at the web app,
 * never at a packaged Electron `file:`/custom-scheme origin. Falls back to the
 * current origin in the browser (dev + web).
 */
function shareOrigin(): string {
  const configured = env('NEXT_PUBLIC_NOTA_WEB_APP_ORIGIN');
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    window.location.protocol.startsWith('http')
  ) {
    return window.location.origin;
  }
  // ponytail: hardcoded prod fallback for packaged Electron (file: origin);
  // set NEXT_PUBLIC_NOTA_WEB_APP_ORIGIN to override per environment.
  return 'https://app.getmadrid.app';
}

/** Full public URL for a share token. */
export function buildShareUrl(token: string): string {
  return `${shareOrigin()}${SHARED_NOTE_PATH_PREFIX}${token}`;
}

/** 122-bit unguessable token, hyphens stripped for a tidy URL. */
function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Mint (or reuse) a note's share token and return its public URL. Owner-only:
 * the update runs under the caller's RLS, so only the note owner can share.
 */
export async function shareNote(
  client: SupabaseClient,
  noteId: string,
  existingToken?: string | null,
): Promise<{ token: string; url: string }> {
  if (existingToken) {
    return { token: existingToken, url: buildShareUrl(existingToken) };
  }
  const token = generateShareToken();
  const { error } = await client
    .from('notes')
    .update({ share_token: token })
    .eq('id', noteId);
  if (error) {
    throw new Error(`Failed to share note: ${error.message}`);
  }
  return { token, url: buildShareUrl(token) };
}

export interface SharedNote {
  id: string;
  title: string;
  content: unknown;
  editorSettings: unknown;
  /** Author's snapshot display name for the Share Card; null when unset. */
  authorDisplayName: string | null;
  updatedAt: string | null;
}

/** Fetch a shared note by token via the public RPC (anon-safe). */
export async function fetchSharedNote(
  token: string,
): Promise<SharedNote | null> {
  const { data, error } = await getSupabaseAnonClient()
    .rpc('get_shared_note', { p_token: token })
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load shared note: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  const row = data as {
    id: string;
    title: string;
    content: unknown;
    editor_settings: unknown;
    author_display_name: string | null;
    updated_at: string | null;
  };
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    editorSettings: row.editor_settings,
    authorDisplayName: row.author_display_name ?? null,
    updatedAt: row.updated_at,
  };
}

/**
 * Attachment metadata for a shared note, shaped like a `note_attachments` row
 * minus `user_id` -- the public RPC does not expose the owner. The editor's
 * attachment map is keyed by `id`; `storage_path` identifies the file but is not
 * fetchable by an anon client, which is why bytes go through
 * `/s/<token>/attachment/<id>` instead.
 */
export interface SharedNoteAttachment {
  id: string;
  note_id: string;
  storage_path: string;
  filename: string;
  content_type: string;
  size_bytes: number | null;
  created_at: string | null;
}

/** Fetch a shared note's attachment metadata by token (anon-safe). */
export async function fetchSharedNoteAttachments(
  token: string,
): Promise<SharedNoteAttachment[]> {
  const result = await getSupabaseAnonClient().rpc(
    'get_shared_note_attachments',
    { p_token: token },
  );
  if (result.error) {
    throw new Error(
      `Failed to load shared note attachments: ${result.error.message}`,
    );
  }
  return (result.data ?? []) as SharedNoteAttachment[];
}

/**
 * Subscribe to live updates for a shared note. The DB trigger broadcasts to the
 * public `share:<token>` topic on every edit; `onUpdate` fires so the viewer can
 * refetch. Returns an unsubscribe function.
 */
export function subscribeSharedNote(
  token: string,
  onUpdate: () => void,
): () => void {
  const channel = getSupabaseAnonClient()
    .channel(`share:${token}`, { config: { private: false } })
    .on('broadcast', { event: 'update' }, () => {
      onUpdate();
    })
    .subscribe();
  return () => {
    void getSupabaseAnonClient().removeChannel(channel);
  };
}
