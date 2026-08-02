import { useEffect, useState } from 'react';
import type * as Y from 'yjs';

import { getBrowserClient } from '@nota/data-source/supabase/browser';
import { createNoteYjsDoc } from './note-yjs-doc.js';
import { SupabaseYjsProvider } from './supabase-yjs-provider.js';

interface NoteYjsDocState {
  /** Live Yjs doc for the note, or null when not collaborative (unentitled / no note). */
  ydoc: Y.Doc | null;
  /** True once local IndexedDB + server log have both loaded — safe to seed. */
  synced: boolean;
}

const IDLE: NoteYjsDocState = { ydoc: null, synced: false };

/**
 * Own a note's Yjs doc lifecycle: local persistence, cloud sync provider, and
 * teardown on note switch/unmount. Only active when entitled — unentitled users
 * keep the legacy content path (they have no cloud vault to sync anyway).
 *
 * `actor` is the Clerk sub (user id); it must match the Supabase JWT or RLS
 * rejects the insert.
 */
export function useNoteYjsDoc(
  noteId: string | null,
  actor: string | null,
  entitled: boolean,
): NoteYjsDocState {
  const [state, setState] = useState<NoteYjsDocState>(IDLE);

  useEffect(() => {
    if (!entitled || !noteId || !actor) {
      setState(IDLE);
      return;
    }

    const alive = { current: true };
    const { doc, persistence } = createNoteYjsDoc(noteId);
    const provider = new SupabaseYjsProvider(doc, {
      client: getBrowserClient(),
      noteId,
      actor,
    });

    // Bind the doc immediately (empty or local-restored); gate seeding on sync.
    setState({ ydoc: doc, synced: false });

    void (async () => {
      await persistence.whenSynced;
      await provider.connect();
      if (!alive.current) return;
      setState({ ydoc: doc, synced: true });
    })();

    return () => {
      alive.current = false;
      provider.destroy();
      void persistence.destroy();
      doc.destroy();
    };
  }, [noteId, actor, entitled]);

  return state;
}
