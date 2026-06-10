import type { RemoteNotePatchInput } from './outbox-ports.js';
import type {
  CreateNoteMutationInput,
  CreateNoteMutationResult,
  DeleteNoteMutationResult,
  NotePatchFields,
  PatchNoteMutationInput,
  PatchNoteMutationResult,
  VaultMutator,
  VaultMutatorDeps,
} from './vault-mutation-ports.js';

export type { VaultMutator, VaultMutatorDeps } from './vault-mutation-ports.js';
export type {
  CreateNoteMutationInput,
  CreateNoteMutationResult,
  DeleteNoteMutationResult,
  NoteDraftContext,
  NotePatchFields,
  PatchNoteMutationInput,
  PatchNoteMutationResult,
} from './vault-mutation-ports.js';

const DEFAULT_CREATE_TITLE = 'Untitled Note';

function resolveCreateFolderId(
  folderId: CreateNoteMutationInput['folderId'],
): string | null {
  return folderId === undefined ? null : folderId;
}

function fieldsToRemotePatch(fields: NotePatchFields): RemoteNotePatchInput {
  return { ...fields };
}

function mergeDraftPatch(
  noteId: string,
  draftContext: PatchNoteMutationInput['draftContext'],
  fields: NotePatchFields,
) {
  return {
    id: noteId,
    ...draftContext,
    ...fields,
  };
}

async function queueLocalPatch(
  deps: VaultMutatorDeps,
  userId: string,
  noteId: string,
  fields: NotePatchFields,
): Promise<PatchNoteMutationResult> {
  await deps.local.saveLocalNoteDraft(userId, { id: noteId, ...fields });
  void deps.drainer.drain(userId);
  return { outcome: 'patched-local' };
}

async function createLocalNote(
  deps: VaultMutatorDeps,
  userId: string,
  title: string,
  folderId: string | null,
): Promise<CreateNoteMutationResult> {
  const noteId = await deps.local.createLocalOnlyNote(
    userId,
    title,
    undefined,
    folderId,
  );
  return { outcome: 'created-local', noteId };
}

async function queueLocalDelete(
  deps: VaultMutatorDeps,
  userId: string,
  noteId: string,
): Promise<DeleteNoteMutationResult> {
  const stored = await deps.local.getStoredNote(userId, noteId);
  await deps.local.markPendingDelete(userId, noteId, !stored?.pending_create);
  void deps.drainer.drain(userId);
  return { outcome: 'queued-local-delete' };
}

export function createVaultMutator(deps: VaultMutatorDeps): VaultMutator {
  return {
    async createNote(userId, input = {}) {
      const title = input.title ?? DEFAULT_CREATE_TITLE;
      const folderId = resolveCreateFolderId(input.folderId);

      if (deps.connectivity.isOnline() && (await deps.connectivity.canSync())) {
        try {
          const note = await deps.remote.createNoteEager(userId, {
            title,
            folder_id: folderId,
          });
          return { outcome: 'created-remote', note };
        } catch {
          return await createLocalNote(deps, userId, title, folderId);
        }
      }
      return await createLocalNote(deps, userId, title, folderId);
    },
    async patchNote(userId, input) {
      const { noteId, fields, draftContext, allowRemote = true } = input;

      try {
        if (draftContext) {
          await deps.local.saveLocalNoteDraft(
            userId,
            mergeDraftPatch(noteId, draftContext, fields),
          );
        }

        if (
          allowRemote &&
          deps.connectivity.isOnline() &&
          (await deps.connectivity.canSync())
        ) {
          try {
            const note = await deps.remote.updateNote(
              noteId,
              fieldsToRemotePatch(fields),
            );
            await deps.local.markNoteSyncedFromServer(userId, note);
            return { outcome: 'patched-remote', note };
          } catch {
            if (!draftContext) {
              await deps.local.saveLocalNoteDraft(userId, {
                id: noteId,
                ...fields,
              });
            }
            void deps.drainer.drain(userId);
            return { outcome: 'patched-local' };
          }
        }

        if (!draftContext) {
          return await queueLocalPatch(deps, userId, noteId, fields);
        }
        return { outcome: 'patched-local' };
      } catch (error) {
        void deps.drainer.drain(userId);
        throw error;
      }
    },
    async deleteNote(userId, noteId) {
      if (deps.connectivity.isOnline() && (await deps.connectivity.canSync())) {
        try {
          await deps.remote.deleteNote(noteId);
          return { outcome: 'deleted-remote' };
        } catch {
          return await queueLocalDelete(deps, userId, noteId);
        }
      }
      return await queueLocalDelete(deps, userId, noteId);
    },
  };
}
