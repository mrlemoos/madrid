import type { Note } from '@getmadrid/database-types';
import { sortOutboxForProcessing } from './sort-outbox-for-processing';
import type { StoredNote } from './types';
import type {
  OutboxDrainDeps,
  RemoteNoteCreateInput,
  RemoteNoteUpsertInput,
} from './outbox-ports';

export type { OutboxDrainDeps } from './outbox-ports';
export type OutboxDrainer = {
  drain(userId: string): Promise<boolean>;
};

export function storedNoteToRemoteUpsertInput(
  stored: StoredNote,
): RemoteNoteUpsertInput {
  return {
    title: stored.title,
    content: stored.content,
    due_at: stored.due_at,
    is_deadline: stored.is_deadline,
    editor_settings: stored.editor_settings,
    folder_id: stored.folder_id ?? null,
  };
}

function storedNoteToRemoteCreateInput(
  stored: StoredNote,
): RemoteNoteCreateInput {
  return {
    id: stored.id,
    ...storedNoteToRemoteUpsertInput(stored),
  };
}

/**
 * Process the outbox against the remote note store.
 * @returns whether any operation completed successfully.
 */
export async function drainOutbox(
  userId: string,
  deps: OutboxDrainDeps,
): Promise<boolean> {
  if (!deps.connectivity.isOnline()) {
    return false;
  }

  if (!(await deps.connectivity.canSync())) {
    return false;
  }

  const entries = sortOutboxForProcessing(await deps.local.listOutbox(userId));
  let progressed = false;

  for (const entry of entries) {
    const stored = await deps.local.getStoredNote(userId, entry.noteId);

    if (entry.kind === 'delete') {
      if (!stored?.pending_delete) {
        await deps.local.removeOutboxEntry(userId, entry.noteId);
        continue;
      }
      try {
        if (!stored.pending_create) {
          await deps.remote.deleteNote(entry.noteId);
        }
        await deps.local.removeStoredNote(userId, entry.noteId);
        progressed = true;
      } catch {
        // Caller may retry; keep outbox entry for another drain pass.
      }
      continue;
    }

    if (!stored || stored.pending_delete) {
      await deps.local.removeOutboxEntry(userId, entry.noteId);
      continue;
    }

    try {
      let synced: Note;
      if (stored.pending_create) {
        synced = await deps.remote.createNote(
          userId,
          storedNoteToRemoteCreateInput(stored),
        );
      } else {
        synced = await deps.remote.updateNote(
          stored.id,
          storedNoteToRemoteUpsertInput(stored),
        );
      }
      await deps.local.markNoteSyncedFromServer(userId, synced);
      progressed = true;
    } catch {
      // Caller may retry; keep outbox entry for another drain pass.
    }
  }

  return progressed;
}

/** Drain with coalesced concurrent calls (one in-flight promise per drainer). */
export function createOutboxDrainer(deps: OutboxDrainDeps): OutboxDrainer {
  let drainPromise: Promise<boolean> | null = null;

  return {
    drain(userId: string): Promise<boolean> {
      if (drainPromise) {
        return drainPromise;
      }
      drainPromise = (async () => {
        try {
          return await drainOutbox(userId, deps);
        } finally {
          drainPromise = null;
        }
      })();
      return drainPromise;
    },
  };
}
