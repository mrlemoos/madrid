import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Sidebar width band. Kept local to the store so it stays a leaf of the runtime
 * spine; the app's `nota-sidebar-width` helper mirrors these values for the resize
 * interaction (default width originates from the motion design token, 288px).
 */
const NOTA_SIDEBAR_DEFAULT_WIDTH_PX = 288;
const NOTA_SIDEBAR_MIN_WIDTH_PX = 240;
const NOTA_SIDEBAR_MAX_WIDTH_PX = 480;

function clampNotaSidebarWidthPx(widthPx: number): number {
  if (!Number.isFinite(widthPx)) {
    return NOTA_SIDEBAR_DEFAULT_WIDTH_PX;
  }
  return Math.min(
    NOTA_SIDEBAR_MAX_WIDTH_PX,
    Math.max(NOTA_SIDEBAR_MIN_WIDTH_PX, Math.round(widthPx)),
  );
}

export interface NotesSidebarState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  widthPx: number;
  setSidebarWidthPx: (widthPx: number) => void;
  /** Folders the user has collapsed; absence from this list = expanded. */
  collapsedFolderIds: string[];
  toggleFolderCollapsed: (folderId: string) => void;
  /** Ensures a folder is expanded (e.g. when opening a note inside it). */
  expandFolder: (folderId: string) => void;
  /** Expands every listed folder (e.g. ancestors of a nested note). */
  expandFolderAncestors: (folderIds: readonly string[]) => void;
  /** Remove ids for deleted or unknown folders from persisted storage. */
  pruneCollapsedFolderIds: (validFolderIds: Iterable<string>) => void;
}

/** Exposed for tests: must stay aligned with `persist` `partialize` (reload safety). */
export function partializeNotesSidebarForStorage(
  state: NotesSidebarState,
): Pick<NotesSidebarState, 'open' | 'collapsedFolderIds' | 'widthPx'> {
  return {
    open: state.open,
    collapsedFolderIds: state.collapsedFolderIds,
    widthPx: state.widthPx,
  };
}

export const useNotesSidebarStore = create<NotesSidebarState>()(
  persist(
    (set) => ({
      open: true,
      setOpen: (open) => set({ open }),
      toggle: () => set((s) => ({ open: !s.open })),
      widthPx: NOTA_SIDEBAR_DEFAULT_WIDTH_PX,
      setSidebarWidthPx: (widthPx) =>
        set({ widthPx: clampNotaSidebarWidthPx(widthPx) }),

      collapsedFolderIds: [],
      toggleFolderCollapsed: (folderId) =>
        set((s) => {
          const has = s.collapsedFolderIds.includes(folderId);
          return {
            collapsedFolderIds: has
              ? s.collapsedFolderIds.filter((id) => id !== folderId)
              : [...s.collapsedFolderIds, folderId],
          };
        }),
      expandFolder: (folderId) =>
        set((s) => ({
          collapsedFolderIds: s.collapsedFolderIds.filter(
            (id) => id !== folderId,
          ),
        })),
      expandFolderAncestors: (folderIds) => {
        if (folderIds.length === 0) {
          return;
        }
        const drop = new Set(folderIds);
        set((s) => ({
          collapsedFolderIds: s.collapsedFolderIds.filter(
            (id) => !drop.has(id),
          ),
        }));
      },
      pruneCollapsedFolderIds: (validFolderIds) => {
        const valid = new Set(validFolderIds);
        set((s) => ({
          collapsedFolderIds: s.collapsedFolderIds.filter((id) =>
            valid.has(id),
          ),
        }));
      },
    }),
    {
      name: 'nota-notes-sidebar',
      partialize: (state) => partializeNotesSidebarForStorage(state),
      merge: (persisted, current) => {
        const p = persisted as Partial<NotesSidebarState> | undefined;
        return {
          ...current,
          ...p,
          widthPx: clampNotaSidebarWidthPx(
            typeof p?.widthPx === 'number' ? p.widthPx : current.widthPx,
          ),
        };
      },
    },
  ),
);
