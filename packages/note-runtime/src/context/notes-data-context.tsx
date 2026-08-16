import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Folder, Note, UserPreferences } from '@nota/database-types';
import {
  getBrowserClient,
  isSupabaseClerkGetTokenRegistered,
} from '@nota/data-source/supabase/browser';
import { isLikelyOnline } from '@nota/data-source/notes-offline-sync';
import { listStoredNotes, putServerNoteIfNotDirty } from '@nota/notes-offline';
import { syncServerNotesToIdbInChunks } from '@nota/data-source/sync-server-notes-to-idb';
import { loadVault, type VaultLoadPorts } from '@nota/data-source/vault-load';
import { listFolders } from '@nota/data-source/models/folders';
import { listNotes } from '@nota/data-source/models/notes';
import { getUserPreferences } from '@nota/data-source/models/user-preferences';
import { isClerkAccessTokenGetterRegistered } from '@nota/data-source/clerk-token-ref';
import {
  readNotaServerEntitledSession,
  syncNotaServerEntitledSession,
} from '@nota/data-source/nota-pro-entitled-session';
import { useAppSession } from './session-context';
import { debounce } from '@nota/isomorphic-helpers';

/**
 * App-owned collaborators injected at composition time. These live in feature
 * clusters that must not become upward package dependencies of the runtime spine
 * (nota-server entitlement client, hash navigation, welcome-note seeding, the
 * attachment signed-URL cache), so the app passes them in.
 */
export type NotesDataProviderPorts = {
  /** Fetch the Nota Pro entitlement response from nota-server (Bearer). */
  fetchNotaProEntitled: () => Promise<Response>;
  /** Seed the welcome note when the vault is empty; returns the new note id or null. */
  runWelcomeNoteSeedIfNeeded: (args: {
    userId: string;
    welcomeSeeded: boolean;
    notesCount: number;
  }) => Promise<string | null>;
  /** Navigate the app to the freshly seeded welcome note. */
  navigateToNote: (noteId: string) => void;
  /** Clear the per-session attachment signed-URL cache on user change. */
  clearNoteAttachmentSignedUrlCache: () => void;
};

export type RefreshNotesListOptions = {
  /**
   * When true, refresh list data without toggling global `loading` (avoids shell flash and
   * effect churn from `useNotesOfflineSync` / follow-up fetches).
   */
  silent?: boolean;
};

export type NotesDataContextValue = {
  /** Server-confirmed active subscription (Nota Pro entitlement): vault, cloud, sync. */
  notaProEntitled: boolean;
  notes: Note[];
  folders: Folder[];
  userPreferences: UserPreferences | null;
  loadError?: string;
  loading: boolean;
  refreshNotesList: (options?: RefreshNotesListOptions) => Promise<void>;
  patchNoteInList: (id: string, patch: Partial<Note>) => void;
  removeNoteFromList: (id: string) => void;
  insertNoteAtFront: (note: Note) => void;
  insertFolderSorted: (folder: Folder) => void;
  removeFolderFromList: (id: string) => void;
  patchFolderInList: (id: string, patch: Partial<Folder>) => void;
  setUserPreferencesInState: (row: UserPreferences | null) => void;
};

export type NotesDataActionsSlice = Pick<
  NotesDataContextValue,
  | 'refreshNotesList'
  | 'patchNoteInList'
  | 'removeNoteFromList'
  | 'insertNoteAtFront'
  | 'insertFolderSorted'
  | 'removeFolderFromList'
  | 'patchFolderInList'
  | 'setUserPreferencesInState'
>;

export type NotesDataVaultSlice = Pick<
  NotesDataContextValue,
  'notes' | 'folders'
>;

export type NotesDataMetaSlice = Pick<
  NotesDataContextValue,
  'notaProEntitled' | 'loading' | 'userPreferences' | 'loadError'
>;

export const NotesDataActionsContext =
  createContext<NotesDataActionsSlice | null>(null);
export const NotesDataVaultContext = createContext<NotesDataVaultSlice | null>(
  null,
);
export const NotesDataMetaContext = createContext<NotesDataMetaSlice | null>(
  null,
);

function requireNotesDataProviderValue<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error('NotesDataProvider is required');
  }
  return value;
}

type FullNotesDataSlices = {
  actions: NotesDataActionsSlice;
  vault: NotesDataVaultSlice;
  meta: NotesDataMetaSlice;
};

function parseFullNotesDataSlices(
  actions: NotesDataActionsSlice | null,
  vault: NotesDataVaultSlice | null,
  meta: NotesDataMetaSlice | null,
): FullNotesDataSlices | null {
  if (!actions || !vault || !meta) {
    return null;
  }
  return { actions, vault, meta };
}

function requireFullNotesDataSlices(
  actions: NotesDataActionsSlice | null,
  vault: NotesDataVaultSlice | null,
  meta: NotesDataMetaSlice | null,
): FullNotesDataSlices {
  return requireNotesDataProviderValue(
    parseFullNotesDataSlices(actions, vault, meta),
  );
}

async function waitForClerkBridge(maxMs = 600): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (
      isClerkAccessTokenGetterRegistered() &&
      isSupabaseClerkGetTokenRegistered()
    ) {
      return;
    }
    await new Promise((r) => setTimeout(r, 16));
  }
}

export function NotesDataProvider({
  children,
  ports,
}: {
  children: ReactNode;
  ports: NotesDataProviderPorts;
}) {
  const { user } = useAppSession();
  const userId = user?.id;

  const portsRef = useRef(ports);
  portsRef.current = ports;

  const [notaProEntitled, setNotaProEntitled] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const welcomeSeeded = userPreferences?.welcome_seeded === true;
  const [loadError, setLoadError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const didRetryEmptyVaultAfterWelcomeSeededRef = useRef(false);
  const welcomeSeedGenerationRef = useRef(0);
  const refreshChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    didRetryEmptyVaultAfterWelcomeSeededRef.current = false;
    refreshChainRef.current = Promise.resolve();
    portsRef.current.clearNoteAttachmentSignedUrlCache();
  }, [userId]);

  const refreshNotesList = useCallback(
    async (options?: RefreshNotesListOptions) => {
      const silent = options?.silent === true;

      const perform = async (): Promise<void> => {
        if (userId) {
          await waitForClerkBridge();
          if (!silent) {
            setLoading(true);
          }
          setLoadError(undefined);
        }

        const ports: VaultLoadPorts = {
          entitlement: {
            fetchEntitled: async () => {
              const res = await portsRef.current.fetchNotaProEntitled();
              if (!res.ok) {
                throw new Error(
                  `Entitlement fetch failed: ${String(res.status)}`,
                );
              }
              const json = (await res.json()) as { entitled?: boolean };
              return json.entitled === true;
            },
            readSession: readNotaServerEntitledSession,
            syncSession: syncNotaServerEntitledSession,
          },
          remote: {
            listNotes: () => listNotes(getBrowserClient()),
            listFolders: () => listFolders(getBrowserClient()),
            getPrefs: (uid) => getUserPreferences(getBrowserClient(), uid),
          },
          local: {
            listStoredNotes,
            syncServerNotes: (uid, serverNotes) =>
              syncServerNotesToIdbInChunks(
                uid,
                serverNotes,
                putServerNoteIfNotDirty,
              ),
          },
          isLikelyOnline,
        };

        try {
          const result = await loadVault({ userId, ports });
          switch (result.kind) {
            case 'signed-out':
            case 'not-entitled':
              setNotaProEntitled(false);
              setNotes([]);
              setFolders([]);
              setUserPreferences(null);
              break;
            case 'loaded':
              setNotaProEntitled(true);
              setNotes(result.notes);
              setFolders(result.folders);
              setUserPreferences(result.prefs);
              setLoadError(result.loadError);
              break;
            case 'recovered':
              setNotaProEntitled(result.entitled);
              setNotes(result.notes);
              setFolders([]);
              setUserPreferences(null);
              setLoadError(result.loadError);
              break;
          }
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      };

      const queued = refreshChainRef.current.then(perform);
      refreshChainRef.current = queued.catch(() => undefined);
      await queued;
    },
    [userId],
  );

  useEffect(() => {
    void refreshNotesList();
  }, [refreshNotesList]);

  useEffect(() => {
    if (!userId || !isLikelyOnline()) {
      return;
    }
    const schedule = debounce(() => {
      void refreshNotesList({ silent: true });
    }, 300);
    schedule();
    return () => {
      schedule.cancel();
    };
  }, [userId, refreshNotesList]);

  useEffect(() => {
    if (!userId || loading || !notaProEntitled) {
      return;
    }
    const gen = ++welcomeSeedGenerationRef.current;
    void (async () => {
      const id = await portsRef.current.runWelcomeNoteSeedIfNeeded({
        userId,
        welcomeSeeded,
        notesCount: notes.length,
      });
      if (gen !== welcomeSeedGenerationRef.current) {
        return;
      }
      if (id) {
        didRetryEmptyVaultAfterWelcomeSeededRef.current = false;
        await refreshNotesList({ silent: true });
        if (gen !== welcomeSeedGenerationRef.current) {
          return;
        }
        portsRef.current.navigateToNote(id);
        return;
      }
      if (
        welcomeSeeded &&
        notes.length === 0 &&
        !didRetryEmptyVaultAfterWelcomeSeededRef.current
      ) {
        didRetryEmptyVaultAfterWelcomeSeededRef.current = true;
        await refreshNotesList({ silent: true });
      }
    })();
    return () => {
      welcomeSeedGenerationRef.current += 1;
    };
  }, [
    userId,
    loading,
    notaProEntitled,
    notes.length,
    refreshNotesList,
    welcomeSeeded,
  ]);

  const patchNoteInList = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) {
        return prev;
      }
      const merged = { ...prev[idx], ...patch };
      const next = [...prev];
      next[idx] = merged;
      next.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      return next;
    });
  }, []);

  const removeNoteFromList = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const insertNoteAtFront = useCallback((note: Note) => {
    setNotes((prev) => {
      const rest = prev.filter((n) => n.id !== note.id);
      return [note, ...rest];
    });
  }, []);

  const insertFolderSorted = useCallback((folder: Folder) => {
    setFolders((prev) => {
      const next = [...prev.filter((f) => f.id !== folder.id), folder];
      next.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      );
      return next;
    });
  }, []);

  const removeFolderFromList = useCallback((id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const patchFolderInList = useCallback(
    (id: string, patch: Partial<Folder>) => {
      setFolders((prev) => {
        const idx = prev.findIndex((f) => f.id === id);
        if (idx === -1) {
          return prev;
        }
        const merged = { ...prev[idx], ...patch };
        const next = [...prev];
        next[idx] = merged;
        next.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        );
        return next;
      });
    },
    [],
  );

  const actionsValue = useMemo(
    () =>
      ({
        refreshNotesList,
        patchNoteInList,
        removeNoteFromList,
        insertNoteAtFront,
        insertFolderSorted,
        removeFolderFromList,
        patchFolderInList,
        setUserPreferencesInState: setUserPreferences,
      }) satisfies NotesDataActionsSlice,
    [
      refreshNotesList,
      patchNoteInList,
      removeNoteFromList,
      insertNoteAtFront,
      insertFolderSorted,
      removeFolderFromList,
      patchFolderInList,
    ],
  );

  const vaultValue = useMemo(
    (): NotesDataVaultSlice => ({
      notes,
      folders,
    }),
    [notes, folders],
  );

  const metaValue = useMemo(
    () =>
      ({
        notaProEntitled,
        loading,
        userPreferences,
        loadError,
      }) satisfies NotesDataMetaSlice,
    [notaProEntitled, loading, userPreferences, loadError],
  );

  return (
    <NotesDataActionsContext.Provider value={actionsValue}>
      <NotesDataMetaContext.Provider value={metaValue}>
        <NotesDataVaultContext.Provider value={vaultValue}>
          {children}
        </NotesDataVaultContext.Provider>
      </NotesDataMetaContext.Provider>
    </NotesDataActionsContext.Provider>
  );
}

export function useNotesDataActions(): NotesDataActionsSlice {
  return requireNotesDataProviderValue(use(NotesDataActionsContext));
}

export function useNotesDataVault(): NotesDataVaultSlice {
  return requireNotesDataProviderValue(use(NotesDataVaultContext));
}

export function useNotesDataMeta(): NotesDataMetaSlice {
  return requireNotesDataProviderValue(use(NotesDataMetaContext));
}

function useMergedNotesData(
  actions: NotesDataActionsSlice,
  vault: NotesDataVaultSlice,
  meta: NotesDataMetaSlice,
): NotesDataContextValue {
  return useMemo(
    () => ({
      ...actions,
      ...vault,
      ...meta,
    }),
    [actions, vault, meta],
  );
}

export function useNotesData(): NotesDataContextValue {
  const slices = requireFullNotesDataSlices(
    use(NotesDataActionsContext),
    use(NotesDataVaultContext),
    use(NotesDataMetaContext),
  );
  return useMergedNotesData(slices.actions, slices.vault, slices.meta);
}

export function useOptionalNotesData(): NotesDataContextValue | null {
  const actions = use(NotesDataActionsContext);
  const vault = use(NotesDataVaultContext);
  const meta = use(NotesDataMetaContext);
  const slices = parseFullNotesDataSlices(actions, vault, meta);
  return useMemo((): NotesDataContextValue | null => {
    if (!slices) {
      return null;
    }
    return {
      ...slices.actions,
      ...slices.vault,
      ...slices.meta,
    };
  }, [slices]);
}

/**
 * Meta slice only when the full notes tree is mounted; for gates that must not
 * subscribe to `notes` churn (e.g. command palette shell).
 */
export function useOptionalNotesDataMeta(): NotesDataMetaSlice | null {
  const slices = parseFullNotesDataSlices(
    use(NotesDataActionsContext),
    use(NotesDataVaultContext),
    use(NotesDataMetaContext),
  );
  if (!slices) {
    return null;
  }
  return slices.meta;
}

export function useOptionalNotesDataActions(): NotesDataActionsSlice | null {
  const slices = parseFullNotesDataSlices(
    use(NotesDataActionsContext),
    use(NotesDataVaultContext),
    use(NotesDataMetaContext),
  );
  if (!slices) {
    return null;
  }
  return slices.actions;
}
