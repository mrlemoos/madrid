export type {
  LocalNoteMeta,
  OutboxEntry,
  OutboxKind,
  StoredNote,
} from './lib/types';
export { DEFAULT_NOTE_CONTENT } from './lib/types';
export {
  mergeNoteLists,
  mergeNoteWithLocal,
  storedNoteToListRow,
} from './lib/merge-note-with-local';
export { sortOutboxForProcessing } from './lib/sort-outbox-for-processing';
export type {
  LocalNoteOutboxStore,
  OutboxDrainDeps,
  RemoteNoteCreateInput,
  RemoteNoteEagerCreateInput,
  RemoteNotePatchInput,
  RemoteNoteSync,
  RemoteNoteUpsertInput,
  VaultConnectivity,
} from './lib/outbox-ports';
export {
  createOutboxDrainer,
  drainOutbox,
  storedNoteToRemoteUpsertInput,
} from './lib/drain-outbox';
export type { OutboxDrainer } from './lib/drain-outbox';
export type {
  CreateNoteMutationInput,
  CreateNoteMutationResult,
  DeleteNoteMutationResult,
  LocalNoteDraftPatch,
  LocalNoteMutationStore,
  NoteDraftContext,
  NotePatchFields,
  PatchNoteMutationInput,
  PatchNoteMutationResult,
  VaultMutator,
  VaultMutatorDeps,
} from './lib/vault-mutation-ports';
export { createVaultMutator } from './lib/vault-mutator';
