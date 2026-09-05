import type { Json, Note } from '@getmadrid/database-types';
import type { OutboxEntry, StoredNote } from './types';

/** Fields replayed to the remote note store on outbox upsert. */
export type RemoteNoteUpsertInput = {
  title: string;
  content: Json;
  due_at: string | null;
  is_deadline: boolean;
  editor_settings: Json;
  banner_attachment_id?: string | null;
  folder_id: string | null;
};

/** Partial note row update (eager patch or outbox replay). */
export type RemoteNotePatchInput = Partial<RemoteNoteUpsertInput>;

/** Fields replayed when creating a note from a pending local row. */
export type RemoteNoteCreateInput = RemoteNoteUpsertInput & {
  id: string;
};

/** Eager online create with a server-assigned note id. */
export type RemoteNoteEagerCreateInput = {
  title: string;
  content?: Json;
  folder_id: string | null;
};

/** Local persistence + outbox seam for offline drain. */
export interface LocalNoteOutboxStore {
  getStoredNote(
    userId: string,
    noteId: string,
  ): Promise<StoredNote | null | undefined>;
  listOutbox(userId: string): Promise<OutboxEntry[]>;
  removeOutboxEntry(userId: string, noteId: string): Promise<void>;
  markNoteSyncedFromServer(userId: string, note: Note): Promise<void>;
  removeStoredNote(userId: string, noteId: string): Promise<void>;
}

/** Remote note store seam (Supabase in the web app). */
export interface RemoteNoteSync {
  /** Outbox replay: client-assigned id. */
  createNote(userId: string, input: RemoteNoteCreateInput): Promise<Note>;
  /** Eager path: server-assigned id. */
  createNoteEager(
    userId: string,
    input: RemoteNoteEagerCreateInput,
  ): Promise<Note>;
  updateNote(noteId: string, input: RemoteNotePatchInput): Promise<Note>;
  deleteNote(noteId: string): Promise<void>;
}

/** Connectivity + auth gate before replaying the outbox. */
export interface VaultConnectivity {
  isOnline(): boolean;
  canSync(): Promise<boolean>;
}

export type OutboxDrainDeps = {
  local: LocalNoteOutboxStore;
  remote: RemoteNoteSync;
  connectivity: VaultConnectivity;
};
