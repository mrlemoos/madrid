import type { Folder, Note, UserPreferences } from '~/types/database.types';
import {
  mergeNoteLists,
  storedNoteToListRow,
  type StoredNote,
} from '@/lib/notes-offline';

/**
 * Everything the vault load decision tree needs from the outside world.
 * Adapters: the real Clerk/Supabase/IndexedDB wiring in `NotesDataProvider`,
 * in-memory fakes in `notes-vault-load.spec.ts`.
 */
export type VaultLoadPorts = {
  entitlement: {
    /** Resolves the server-confirmed Nota Pro entitlement; throws on network/HTTP failure. */
    fetchEntitled(): Promise<boolean>;
    readSession(): boolean;
    syncSession(entitled: boolean): void;
  };
  remote: {
    listNotes(): Promise<Note[]>;
    listFolders(): Promise<Folder[]>;
    getPrefs(userId: string): Promise<UserPreferences>;
  };
  local: {
    listStoredNotes(userId: string): Promise<StoredNote[]>;
    syncServerNotes(userId: string, notes: Note[]): Promise<void>;
  };
  isLikelyOnline(): boolean;
};

export type VaultLoadResult =
  | { kind: 'signed-out' }
  | { kind: 'not-entitled' }
  | {
      kind: 'loaded';
      notes: Note[];
      folders: Folder[];
      prefs: UserPreferences;
      loadError?: string;
    }
  | {
      kind: 'recovered';
      entitled: boolean;
      notes: Note[];
      loadError?: string;
    };

const LOAD_ERROR = 'Failed to load notes';

function defaultPrefs(userId: string): UserPreferences {
  return {
    user_id: userId,
    locale: null,
    open_todays_note_shortcut: false,
    show_note_backlinks: true,
    semantic_search_enabled: true,
    emoji_replacer_enabled: true,
    welcome_seeded: false,
    delete_empty_folders: true,
    show_writing_activity_graph: false,
    writing_activity_color: 'blue',
    writing_activity_days: {},
    updated_at: new Date(0).toISOString(),
  };
}

async function listActiveStoredNotes(
  userId: string,
  ports: VaultLoadPorts,
): Promise<Note[]> {
  const stored = await ports.local.listStoredNotes(userId);
  return stored
    .filter(({ pending_delete }) => !pending_delete)
    .map(storedNoteToListRow)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

async function recoverAfterEntitlementFetchFailure(
  userId: string,
  ports: VaultLoadPorts,
): Promise<VaultLoadResult> {
  const sessionSaysEntitled = ports.entitlement.readSession();
  const loadError = ports.isLikelyOnline() ? LOAD_ERROR : undefined;
  const notes = sessionSaysEntitled
    ? await listActiveStoredNotes(userId, ports)
    : [];
  return { kind: 'recovered', entitled: sessionSaysEntitled, notes, loadError };
}

/**
 * The vault load decision tree: entitlement → remote fetch → IndexedDB merge,
 * with offline/error recovery. Pure orchestration over the injected ports —
 * no React, no globals; callers apply the result to state in one place.
 */
export async function loadVault({
  userId,
  ports,
}: {
  userId: string | undefined;
  ports: VaultLoadPorts;
}): Promise<VaultLoadResult> {
  if (!userId) {
    return { kind: 'signed-out' };
  }

  let entitled: boolean;
  try {
    entitled = await ports.entitlement.fetchEntitled();
  } catch {
    return recoverAfterEntitlementFetchFailure(userId, ports);
  }
  ports.entitlement.syncSession(entitled);

  if (!entitled) {
    return { kind: 'not-entitled' };
  }

  try {
    let loadError: string | undefined;
    let serverNotes: Note[] = [];
    try {
      serverNotes = await ports.remote.listNotes();
    } catch (e) {
      console.error('Failed to load notes:', e);
      loadError = LOAD_ERROR;
    }

    let folders: Folder[] = [];
    try {
      folders = await ports.remote.listFolders();
    } catch (e) {
      console.error('Failed to load folders:', e);
    }

    let prefs: UserPreferences;
    try {
      prefs = await ports.remote.getPrefs(userId);
    } catch (e) {
      console.error('Failed to load user preferences:', e);
      prefs = defaultPrefs(userId);
    }

    await ports.local.syncServerNotes(userId, serverNotes);
    const stored = await ports.local.listStoredNotes(userId);
    return {
      kind: 'loaded',
      notes: mergeNoteLists(serverNotes, stored),
      folders,
      prefs,
      loadError,
    };
  } catch (e) {
    console.error(e);
    return recoverAfterEntitlementFetchFailure(userId, ports);
  }
}
