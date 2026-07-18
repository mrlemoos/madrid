import type { Json, Note } from '@nota/database-types';
import type { OutboxDrainer } from './drain-outbox.js';
import type {
  LocalNoteOutboxStore,
  RemoteNoteSync,
  VaultConnectivity,
} from './outbox-ports.js';

export type LocalNoteDraftPatch = {
  id: string;
  title?: string;
  content?: Json;
  user_id?: string;
  created_at?: string;
  due_at?: string | null;
  is_deadline?: boolean;
  editor_settings?: Json;
  banner_attachment_id?: string | null;
  folder_id?: string | null;
};

export type NoteDraftContext = {
  user_id: string;
  created_at: string;
  title?: string;
  content?: Json;
  due_at?: string | null;
  is_deadline?: boolean;
  editor_settings?: Json;
  banner_attachment_id?: string | null;
  folder_id?: string | null;
};

export type NotePatchFields = {
  title?: string;
  content?: Json;
  due_at?: string | null;
  is_deadline?: boolean;
  editor_settings?: Json;
  banner_attachment_id?: string | null;
  folder_id?: string | null;
};

export type PatchNoteMutationInput = {
  noteId: string;
  fields: NotePatchFields;
  /**
   * When set, persist a local draft before the remote attempt (editor typing).
   * When omitted, try remote first and fall back to a local draft (e.g. folder move).
   */
  draftContext?: NoteDraftContext;
  /** When false, skip the eager remote write (e.g. not Nota Pro entitled). */
  allowRemote?: boolean;
};

export type PatchNoteMutationResult =
  { outcome: 'patched-remote'; note: Note } | { outcome: 'patched-local' };

/** Local store seam for note mutations (extends outbox drain surface). */
export interface LocalNoteMutationStore extends LocalNoteOutboxStore {
  saveLocalNoteDraft(userId: string, patch: LocalNoteDraftPatch): Promise<void>;
  createLocalOnlyNote(
    userId: string,
    title?: string,
    content?: Json,
    folderId?: string | null,
  ): Promise<string>;
  markPendingDelete(
    userId: string,
    noteId: string,
    wasSynced: boolean,
  ): Promise<void>;
}

export type CreateNoteMutationInput = {
  /** Omit or `null` = root. UUID string = folder. */
  folderId?: string | null;
  title?: string;
};

export type CreateNoteMutationResult =
  | { outcome: 'created-remote'; note: Note }
  | { outcome: 'created-local'; noteId: string };

export type DeleteNoteMutationResult =
  { outcome: 'deleted-remote' } | { outcome: 'queued-local-delete' };

export type VaultMutatorDeps = {
  local: LocalNoteMutationStore;
  remote: RemoteNoteSync;
  connectivity: VaultConnectivity;
  drainer: OutboxDrainer;
};

export type VaultMutator = {
  createNote(
    userId: string,
    input?: CreateNoteMutationInput,
  ): Promise<CreateNoteMutationResult>;
  patchNote(
    userId: string,
    input: PatchNoteMutationInput,
  ): Promise<PatchNoteMutationResult>;
  deleteNote(userId: string, noteId: string): Promise<DeleteNoteMutationResult>;
};
