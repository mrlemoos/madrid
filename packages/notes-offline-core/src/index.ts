export type {
  LocalNoteMeta,
  OutboxEntry,
  OutboxKind,
  StoredNote,
} from './lib/types.js';
export { DEFAULT_NOTE_CONTENT } from './lib/types.js';
export {
  mergeNoteLists,
  mergeNoteWithLocal,
  storedNoteToListRow,
} from './lib/merge-note-with-local.js';
export { sortOutboxForProcessing } from './lib/sort-outbox-for-processing.js';
export type {
  LocalNoteOutboxStore,
  OutboxDrainDeps,
  RemoteNoteCreateInput,
  RemoteNoteEagerCreateInput,
  RemoteNotePatchInput,
  RemoteNoteSync,
  RemoteNoteUpsertInput,
  VaultConnectivity,
} from './lib/outbox-ports.js';
export {
  createOutboxDrainer,
  drainOutbox,
  storedNoteToRemoteUpsertInput,
} from './lib/drain-outbox.js';
export type { OutboxDrainer } from './lib/drain-outbox.js';
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
} from './lib/vault-mutation-ports.js';
export { createVaultMutator } from './lib/vault-mutator.js';
