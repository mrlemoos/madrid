import {
  createOutboxDrainer,
  createVaultMutator,
  type LocalNoteMutationStore,
  type RemoteNoteCreateInput,
  type RemoteNoteSync,
  type VaultConnectivity,
  type VaultMutator,
} from '@getmadrid/notes-offline-core';
import {
  createNote as createNoteOnServer,
  deleteNote as deleteNoteOnServer,
  updateNote as updateNoteOnServer,
} from '../models/notes';
import { getClerkAccessToken } from './clerk-token-ref';
import { getBrowserClient } from './supabase/browser';
import {
  createLocalOnlyNote,
  getStoredNote,
  listOutbox,
  markNoteSyncedFromServer,
  markPendingDelete,
  removeOutboxEntry,
  removeStoredNote,
  saveLocalNoteDraft,
} from '@getmadrid/notes-offline';

export function isLikelyOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

const connectivity: VaultConnectivity = {
  isOnline: isLikelyOnline,
  async canSync() {
    if (!isLikelyOnline()) {
      return false;
    }
    const token = await getClerkAccessToken();
    return Boolean(token);
  },
};

const localStore: LocalNoteMutationStore = {
  getStoredNote,
  listOutbox,
  removeOutboxEntry,
  markNoteSyncedFromServer,
  removeStoredNote,
  saveLocalNoteDraft,
  createLocalOnlyNote,
  markPendingDelete,
};

const remote: RemoteNoteSync = {
  createNote(userId, input: RemoteNoteCreateInput) {
    const client = getBrowserClient();
    return createNoteOnServer(client, userId, input.title, input.content, {
      id: input.id,
      editor_settings: input.editor_settings,
      folder_id: input.folder_id,
    });
  },
  createNoteEager(userId, input) {
    const client = getBrowserClient();
    return createNoteOnServer(client, userId, input.title, input.content, {
      folder_id: input.folder_id,
    });
  },
  updateNote(noteId, input) {
    const client = getBrowserClient();
    return updateNoteOnServer(client, noteId, {
      title: input.title,
      content: input.content,
      due_at: input.due_at,
      is_deadline: input.is_deadline,
      editor_settings: input.editor_settings,
      folder_id: input.folder_id,
    });
  },
  deleteNote(noteId) {
    const client = getBrowserClient();
    return deleteNoteOnServer(client, noteId);
  },
};

const outboxDrainer = createOutboxDrainer({
  local: localStore,
  remote,
  connectivity,
});

export const vaultMutator: VaultMutator = createVaultMutator({
  local: localStore,
  remote,
  connectivity,
  drainer: outboxDrainer,
});

export function drainNotesOutbox(userId: string): Promise<boolean> {
  return outboxDrainer.drain(userId);
}
