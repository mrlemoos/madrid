import type { SupabaseClient } from '@supabase/supabase-js';

import { viteEnvString } from './vite-env.js';
import { getSupabaseAnonClient } from './supabase/anon.js';

/** Path prefix for the public shared-note page (matched in `main.tsx`). */
export const SHARED_NOTE_PATH_PREFIX = '/s/';

/**
 * Origin that owns the hosted web app. Share links must point at the web app,
 * never at a packaged Electron `file:`/custom-scheme origin. Falls back to the
 * current origin in the browser (dev + web).
 */
function shareOrigin(): string {
  const configured = viteEnvString('VITE_NOTA_WEB_APP_ORIGIN');
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
  // set VITE_NOTA_WEB_APP_ORIGIN to override per environment.
  return 'https://app.nota.mrlemoos.dev';
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
    updated_at: string | null;
  };
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    editorSettings: row.editor_settings,
    updatedAt: row.updated_at,
  };
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
