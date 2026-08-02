import type { RealtimeChannel } from '@supabase/supabase-js';
import { encodeDocAsSnapshot, shouldCompact } from '@nota/notes-yjs-core';
import * as Y from 'yjs';

import type { Database } from '@nota/database-types';

import type { TypedSupabaseBrowserClient } from '@nota/data-source/supabase/browser';
import { base64ToUint8, uint8ToBase64 } from './yjs-base64.js';

type NoteYjsUpdateRow = Database['public']['Tables']['note_yjs_updates']['Row'];

const TABLE = 'note_yjs_updates' as const;

/** Origin tag for updates applied FROM the server, so we never echo them back. */
const REMOTE_ORIGIN = Symbol('nota-supabase-yjs-remote');

export interface SupabaseYjsProviderOptions {
  client: TypedSupabaseBrowserClient;
  noteId: string;
  /** Clerk sub of the writer; must match the JWT or RLS rejects the insert. */
  actor: string;
}

/**
 * Syncs a note's Yjs doc through Supabase: loads the append-only update log,
 * flushes any offline-authored local delta, pushes live local edits, and
 * applies remote edits arriving over Realtime CDC.
 *
 * ponytail: no awareness/cursors here — that's ephemeral and owned by the
 * editor's Collaboration extension (Phase 4). This provider is document sync
 * only. Awareness rides a separate broadcast channel added alongside it later.
 */
export class SupabaseYjsProvider {
  private readonly doc: Y.Doc;
  private readonly db: TypedSupabaseBrowserClient;
  private readonly noteId: string;
  private readonly actor: string;
  private channel: RealtimeChannel | null = null;
  private destroyed = false;
  private readonly onDocUpdate: (update: Uint8Array, origin: unknown) => void;

  constructor(doc: Y.Doc, options: SupabaseYjsProviderOptions) {
    this.doc = doc;
    this.db = options.client;
    this.noteId = options.noteId;
    this.actor = options.actor;
    this.onDocUpdate = (update, origin) => {
      // Skip updates we just applied from the server; push everything local.
      if (origin === REMOTE_ORIGIN) return;
      void this.pushUpdate(update);
    };
  }

  async connect(): Promise<void> {
    this.subscribeRealtime();
    await this.loadAndReconcile();
    if (this.destroyed) return;
    this.doc.on('update', this.onDocUpdate);
  }

  destroy(): void {
    this.destroyed = true;
    this.doc.off('update', this.onDocUpdate);
    if (this.channel) {
      void this.db.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private subscribeRealtime(): void {
    this.channel = this.db
      .channel(`note-yjs:${this.noteId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLE,
          filter: `note_id=eq.${this.noteId}`,
        },
        (payload) => {
          const row = payload.new as NoteYjsUpdateRow;
          this.applyRemote(row.update);
        },
      )
      .subscribe();
  }

  /**
   * Load the full log into the doc and push back whatever the server is missing
   * (edits authored while offline). One delta row reconciles the offline gap.
   */
  private async loadAndReconcile(): Promise<void> {
    const { data, error } = await this.db
      .from(TABLE)
      .select('seq, update')
      .eq('note_id', this.noteId)
      .order('seq', { ascending: true });
    if (error) throw error;
    if (this.destroyed) return;

    const rows = data;

    // Fold server rows into a throwaway doc to learn the server's state vector,
    // then apply them to the live doc as well.
    const serverDoc = new Y.Doc();
    for (const row of rows) {
      const update = base64ToUint8(row.update);
      Y.applyUpdate(serverDoc, update);
      Y.applyUpdate(this.doc, update, REMOTE_ORIGIN);
    }
    const serverStateVector = Y.encodeStateVector(serverDoc);
    serverDoc.destroy();

    // Anything local the server hasn't seen (offline edits, or a fresh seed).
    const missing = Y.encodeStateAsUpdate(this.doc, serverStateVector);
    if (!isEmptyUpdate(missing)) {
      await this.insertUpdate(missing);
    }

    if (rows.length > 0) {
      await this.maybeCompact(rows.length, rows[rows.length - 1].seq);
    }
  }

  /**
   * Fold the log into one snapshot row and prune the rows it covers, so re-opens
   * and late joiners don't replay the whole edit history.
   *
   * Best-effort: only deletes rows at/below `uptoSeq` (captured before the
   * snapshot), so concurrent edits arriving mid-compaction survive. If two
   * clients compact at once they both write a snapshot and delete overlapping
   * rows — redundant but safe, since every snapshot is a full valid state and
   * deletes are idempotent.
   *
   * ponytail: client-side, runs on connect when over threshold (naturally
   * rare). Move to a server cron if per-open client work ever matters.
   */
  private async maybeCompact(rowCount: number, uptoSeq: number): Promise<void> {
    if (this.destroyed || !shouldCompact(rowCount)) return;

    const snapshot = encodeDocAsSnapshot(this.doc);
    const { error: insertError } = await this.db.from(TABLE).insert({
      note_id: this.noteId,
      update: uint8ToBase64(snapshot),
      actor: this.actor,
      is_snapshot: true,
    });
    if (insertError) {
      console.error('[note-yjs] compaction snapshot failed', insertError);
      return;
    }

    const { error: deleteError } = await this.db
      .from(TABLE)
      .delete()
      .eq('note_id', this.noteId)
      .lte('seq', uptoSeq);
    if (deleteError) {
      console.error('[note-yjs] compaction prune failed', deleteError);
    }
  }

  private applyRemote(base64: string): void {
    if (this.destroyed) return;
    Y.applyUpdate(this.doc, base64ToUint8(base64), REMOTE_ORIGIN);
  }

  private async pushUpdate(update: Uint8Array): Promise<void> {
    if (this.destroyed) return;
    await this.insertUpdate(update);
  }

  private async insertUpdate(update: Uint8Array): Promise<void> {
    const { error } = await this.db.from(TABLE).insert({
      note_id: this.noteId,
      update: uint8ToBase64(update),
      actor: this.actor,
      is_snapshot: false,
    });
    // ponytail: on failure the edit is still safe in IndexedDB and will be
    // re-pushed by loadAndReconcile on next connect. Surface, don't crash.
    if (error) console.error('[note-yjs] failed to push update', error);
  }
}

/**
 * A Yjs "no missing state" delta encodes as a 2-byte empty payload. Skip it so
 * we don't write empty rows on every reconnect.
 */
function isEmptyUpdate(update: Uint8Array): boolean {
  return update.length <= 2;
}
