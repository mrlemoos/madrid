import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  clampNotaSidebarWidthPx,
  NOTA_SIDEBAR_DEFAULT_WIDTH_PX,
} from '@/lib/nota-sidebar-width';

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
