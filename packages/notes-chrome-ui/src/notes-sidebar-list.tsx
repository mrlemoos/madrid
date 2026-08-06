import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  type DragEvent,
  type Dispatch,
  type RefObject,
  type ReactNode,
  type SetStateAction,
  type JSX,
} from 'react';
import { Icon } from '@nota/design/icon';
import { TintCircle } from '@nota/design/nota-tint-circle';
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
  ContextMenuViewport,
} from '@nota/design/context-menu';
import {
  Tooltip,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipTrigger,
} from '@nota/design/tooltip';
import { cn } from '@nota/design/utils';
import { NOTA_TRACKING_CHROME_XS_CLASS } from '@nota/notes-chrome-core/chrome-type';
import { useNotesChromeTranslator } from './use-notes-chrome-translator';
import {
  NOTA_SIDEBAR_TREE_BRANCH_CLASS,
  NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS,
  notesSidebarTreeFolderLabelClass,
  notesSidebarTreeFolderRowVariants,
  notesSidebarTreeFolderTriggerClass,
  notesSidebarTreeLeafRowVariants,
  notesSidebarTreeRowVariants,
} from '@nota/notes-chrome-core/sidebar-tree-styles';
import type { Folder, Note, UserPreferences } from '@nota/database-types';
import type { NotesShellPanel } from '@nota/app-navigation-core/navigation';
import { markNavIntent } from '@nota/nota-motion-ui/panel-motion';
import { noteHashHref } from '@nota/note-editor-core/note-hash-href';
import Link from 'next/link';
import { clientCreateNote } from '@nota/note-folders-ui/create-note-client';
import { clientDeleteNoteById } from '@nota/note-folders-ui/delete-note-client';
import { clientMoveNoteToFolder } from '@nota/note-folders-ui/move-note-folder-client';
import {
  NOTA_RENAME_FOLDER_REQUEST_EVENT,
  type RenameFolderRequestDetail,
} from '@nota/note-folders-ui/folder-rename-request';
import {
  FOLDER_TINT_PRESET_LABEL_KEY,
  FOLDER_TINT_SWATCH_PRESETS,
  folderHasPersistedTint,
} from '@nota/note-folders-core/folder-tint-presets';
import { clientRenameFolder } from '@nota/note-folders-ui/rename-folder-client';
import { clientUpdateFolderTint } from '@nota/note-folders-ui/update-folder-tint-client';
import { useNotesSidebarStore } from '@nota/note-runtime/stores/sidebar';
import { compareNoteTitles } from '@nota/note-folders-core/note-sidebar-groups';
import {
  ancestorFolderIds,
  buildFolderTree,
  flattenFoldersWithPathLabels,
  type FolderTreeNode,
} from '@nota/note-folders-core/folder-tree';
import { FolderCreateDialog } from '@nota/note-folders-ui/folder-create-dialog';
import { FolderDeleteDialog } from '@nota/note-folders-ui/folder-delete-dialog';

type NotesSidebarListProps = {
  notes: Note[];
  folders: Folder[];
  panel: NotesShellPanel;
  routeNoteId: string | null;
  userId: string | undefined;
  notaProEntitled: boolean;
  userPreferences: UserPreferences | null;
  insertNoteAtFront: (n: Note) => void;
  insertFolderSorted: (f: Folder) => void;
  patchNoteInList: (id: string, patch: Partial<Note>) => void;
  patchFolderInList: (id: string, patch: Partial<Folder>) => void;
  removeNoteFromList: (id: string) => void;
  removeFolderFromList: (id: string) => void;
  refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
};

function NoteRow(options: {
  note: Note;
  folderMoveTargets: { folderId: string; pathLabel: string }[];
  isActive: boolean;
  /** Nested under a folder row in the tree. */
  nested?: boolean;
  userId: string;
  notaProEntitled: boolean;
  userPreferences: UserPreferences | null;
  removeNoteFromList: (id: string) => void;
  removeFolderFromList: (id: string) => void;
  refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
  draggedNoteId: string | null;
  setDraggedNoteId: (id: string | null) => void;
  setDropTargetId: Dispatch<SetStateAction<string | null>>;
  onMoveNoteToFolder: (
    noteId: string,
    targetFolderId: string | null,
    options?: { clearDragStateAfter?: boolean },
  ) => Promise<void>;
  onMoveNoteToNewFolder: (note: Note) => void;
}): JSX.Element {
  const { t } = useNotesChromeTranslator();
  const {
    note,
    folderMoveTargets,
    isActive,
    nested = false,
    userId,
    notaProEntitled,
    userPreferences,
    removeNoteFromList,
    removeFolderFromList,
    refreshNotesList,
    draggedNoteId,
    setDraggedNoteId,
    setDropTargetId,
    onMoveNoteToFolder,
    onMoveNoteToNewFolder,
  } = options;
  const noteLabel = note.title || 'Untitled Note';

  const noteIsDragged = draggedNoteId === note.id;

  return (
    <li className="list-none">
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <div
              className={cn(
                nested
                  ? notesSidebarTreeLeafRowVariants({ selected: isActive })
                  : notesSidebarTreeRowVariants({ selected: isActive }),
                noteIsDragged && 'opacity-60',
              )}
              draggable
              onDragStart={(event: DragEvent<HTMLDivElement>) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', note.id);
                setDraggedNoteId(note.id);
                setDropTargetId(null);
              }}
              onDragEnd={() => {
                setDraggedNoteId(null);
                setDropTargetId(null);
              }}
            >
              <Icon
                name="file-description"
                size={14}
                strokeWidth={1.5}
                aria-hidden
                data-nota-sidebar-note-icon
                className={cn(
                  'shrink-0',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              />
              <Link
                href={noteHashHref(note.id)}
                className="relative z-0 min-w-0 flex-1 truncate text-sm font-normal"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  markNavIntent('pointer');
                }}
              >
                <Tooltip>
                  <TooltipTrigger
                    delay={750}
                    render={<div className="min-w-0 truncate">{noteLabel}</div>}
                  />
                  <TooltipPortal>
                    <TooltipPositioner side="top" sideOffset={6}>
                      <TooltipPopup>{noteLabel}</TooltipPopup>
                    </TooltipPositioner>
                  </TooltipPortal>
                </Tooltip>
              </Link>
            </div>
          }
        />
        <ContextMenuPortal>
          <ContextMenuPositioner side="right" align="start" sideOffset={4}>
            <ContextMenuPopup>
              <ContextMenuViewport>
                <ContextMenuSubmenuRoot>
                  <ContextMenuSubmenuTrigger label={t('Move to')}>
                    <span className="inline-flex min-w-0 flex-1 items-center gap-2">
                      <Icon
                        name="folder"
                        size={16}
                        className="shrink-0 text-muted-foreground"
                      />
                      <span className="min-w-0 flex-1">{t('Move to')}</span>
                    </span>
                    <Icon
                      name="arrow-narrow-right"
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                  </ContextMenuSubmenuTrigger>
                  <ContextMenuPortal>
                    <ContextMenuPositioner
                      side="right"
                      align="start"
                      sideOffset={4}
                    >
                      <ContextMenuPopup>
                        <ContextMenuViewport>
                          <ContextMenuItem
                            label={t('Root')}
                            onClick={() => {
                              void onMoveNoteToFolder(note.id, null);
                            }}
                          >
                            <Icon
                              name="home"
                              size={16}
                              className="shrink-0 text-muted-foreground"
                            />
                            <span>{t('Root')}</span>
                          </ContextMenuItem>
                          {folderMoveTargets.map(({ folderId, pathLabel }) => (
                            <ContextMenuItem
                              key={folderId}
                              label={pathLabel}
                              onClick={() => {
                                void onMoveNoteToFolder(note.id, folderId);
                              }}
                            >
                              <Icon
                                name="folder"
                                size={16}
                                className="shrink-0 text-muted-foreground"
                              />
                              <span className="min-w-0 flex-1 truncate">
                                {pathLabel}
                              </span>
                            </ContextMenuItem>
                          ))}
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            label={t('New folder')}
                            onClick={() => {
                              onMoveNoteToNewFolder(note);
                            }}
                          >
                            <Icon
                              name="user-plus"
                              size={16}
                              className="shrink-0 text-muted-foreground"
                            />
                            <span>{t('New folder')}</span>
                          </ContextMenuItem>
                        </ContextMenuViewport>
                      </ContextMenuPopup>
                    </ContextMenuPositioner>
                  </ContextMenuPortal>
                </ContextMenuSubmenuRoot>
                <ContextMenuSeparator />
                <ContextMenuItem
                  label={t('Delete note: {noteTitle}', {
                    noteTitle: noteLabel,
                  })}
                  onClick={() => {
                    if (
                      !window.confirm(
                        t('Are you sure you want to delete this note?'),
                      )
                    ) {
                      return;
                    }
                    void clientDeleteNoteById(note.id, {
                      userId,
                      removeNoteFromList,
                      removeFolderFromList,
                      refreshNotesList,
                      notaProEntitled,
                      noteFolderId: note.folder_id ?? null,
                      userPreferences,
                    });
                  }}
                >
                  <Icon
                    name="trash"
                    size={16}
                    className="shrink-0 text-destructive"
                  />
                  <span className="text-destructive">{t('Delete note')}</span>
                </ContextMenuItem>
              </ContextMenuViewport>
            </ContextMenuPopup>
          </ContextMenuPositioner>
        </ContextMenuPortal>
      </ContextMenu>
    </li>
  );
}

function FolderRow(options: {
  folder: Folder;
  folderContentId: string;
  isCollapsed: boolean;
  isDropTarget: boolean;
  draggedNoteId: string | null;
  setDraggedNoteId: (id: string | null) => void;
  setDropTargetId: Dispatch<SetStateAction<string | null>>;
  toggleFolderCollapsed: (folderId: string) => void;
  renamingFolderId: string | null;
  folderRenameDraft: string;
  renameInputRef: RefObject<HTMLInputElement | null>;
  setFolderRenameDraft: (value: string) => void;
  commitFolderRename: (folder: Folder) => void;
  stopRenamingFolder: () => void;
  startRenamingFolder: (folder: Folder) => void;
  setFolderDeleteTarget: (folder: Folder) => void;
  moveDraggedNoteToFolder: (folderId: string) => Promise<void>;
  onRequestNewSubfolder: (folder: Folder) => void;
  onCreateNoteInFolder: (folderId: string) => void;
  userId: string;
  notaProEntitled: boolean;
  patchFolderInList: (id: string, patch: Partial<Folder>) => void;
  children: ReactNode;
}): JSX.Element {
  const { t } = useNotesChromeTranslator();
  const {
    folder,
    folderContentId,
    isCollapsed,
    isDropTarget,
    draggedNoteId,
    setDropTargetId,
    toggleFolderCollapsed,
    renamingFolderId,
    folderRenameDraft,
    renameInputRef,
    setFolderRenameDraft,
    commitFolderRename,
    stopRenamingFolder,
    startRenamingFolder,
    setFolderDeleteTarget,
    moveDraggedNoteToFolder,
    onRequestNewSubfolder,
    onCreateNoteInFolder,
    userId,
    notaProEntitled,
    patchFolderInList,
    children,
  } = options;

  const hasTint = folderHasPersistedTint(folder.tint ?? null);

  return (
    <li className="list-none">
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <div
              className={cn(
                notesSidebarTreeFolderRowVariants({ dragOver: isDropTarget }),
                'px-1.5 text-muted-foreground',
              )}
              data-folder-tint={hasTint ? folder.tint : undefined}
              onDragEnter={(event) => {
                if (!draggedNoteId) {
                  return;
                }
                event.preventDefault();
                setDropTargetId(folder.id);
              }}
              onDragOver={(event) => {
                if (!draggedNoteId) {
                  return;
                }
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTargetId(folder.id);
              }}
              onDragLeave={(event) => {
                if (
                  event.relatedTarget instanceof Node &&
                  event.currentTarget.contains(event.relatedTarget)
                ) {
                  return;
                }
                setDropTargetId((current: string | null) =>
                  current === folder.id ? null : current,
                );
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void moveDraggedNoteToFolder(folder.id);
              }}
            >
              <button
                type="button"
                className={notesSidebarTreeFolderTriggerClass}
                aria-label={
                  isCollapsed
                    ? t('Expand folder {folderName}', {
                        folderName: folder.name,
                      })
                    : t('Collapse folder {folderName}', {
                        folderName: folder.name,
                      })
                }
                aria-expanded={!isCollapsed}
                aria-controls={isCollapsed ? undefined : folderContentId}
                onClick={() => {
                  toggleFolderCollapsed(folder.id);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'F2') {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  startRenamingFolder(folder);
                }}
              >
                <span
                  className={cn(
                    'inline-flex shrink-0',
                    hasTint && 'nota-folder-tint-accent',
                  )}
                  aria-hidden
                >
                  <Icon name="folder" size={14} strokeWidth={1.5} />
                </span>
                {renamingFolderId === folder.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={folderRenameDraft}
                    onChange={(event) => {
                      setFolderRenameDraft(event.target.value);
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        commitFolderRename(folder);
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        stopRenamingFolder();
                      }
                    }}
                    onBlur={() => {
                      commitFolderRename(folder);
                    }}
                    className="relative z-0 min-w-0 flex-1 rounded border border-input bg-background px-1 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    aria-label={t('Rename folder {folderName}', {
                      folderName: folder.name,
                    })}
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger
                      className="min-w-0 flex-1 justify-start text-left"
                      render={
                        <span
                          className={cn(
                            notesSidebarTreeFolderLabelClass,
                            'relative z-0 cursor-default decoration-dotted underline-offset-2 hover:underline',
                            hasTint && 'nota-folder-tint-accent',
                          )}
                          onDoubleClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            startRenamingFolder(folder);
                          }}
                        >
                          {folder.name}
                        </span>
                      }
                    />
                    <TooltipPortal>
                      <TooltipPositioner side="top" sideOffset={6}>
                        <TooltipPopup>
                          {t('Double-click to rename')}
                        </TooltipPopup>
                      </TooltipPositioner>
                    </TooltipPortal>
                  </Tooltip>
                )}
              </button>
            </div>
          }
        />
        <ContextMenuPortal>
          <ContextMenuPositioner side="right" align="start" sideOffset={4}>
            <ContextMenuPopup>
              <ContextMenuViewport>
                <ContextMenuItem
                  label={t('Rename folder {folderName}', {
                    folderName: folder.name,
                  })}
                  onClick={() => {
                    startRenamingFolder(folder);
                  }}
                >
                  <Icon
                    name="pen"
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span>{t('Rename')}</span>
                </ContextMenuItem>
                {notaProEntitled ? (
                  <ContextMenuItem
                    label={t('Create note')}
                    onClick={() => {
                      onCreateNoteInFolder(folder.id);
                    }}
                  >
                    <Icon
                      name="user-plus"
                      size={16}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span>{t('Create note')}</span>
                  </ContextMenuItem>
                ) : null}
                <ContextMenuItem
                  label={t('New subfolder')}
                  onClick={() => {
                    onRequestNewSubfolder(folder);
                  }}
                >
                  <Icon
                    name="user-plus"
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span>{t('New subfolder')}</span>
                </ContextMenuItem>
                {notaProEntitled ? (
                  <ContextMenuSubmenuRoot>
                    <ContextMenuSubmenuTrigger label={t('Tint folder')}>
                      <span className="inline-flex min-w-0 flex-1 items-center gap-2">
                        <Icon
                          name="folder"
                          size={16}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span className="min-w-0 flex-1">
                          {t('Tint folder')}
                        </span>
                      </span>
                      <Icon
                        name="arrow-narrow-right"
                        size={14}
                        className="shrink-0 text-muted-foreground"
                      />
                    </ContextMenuSubmenuTrigger>
                    <ContextMenuPortal>
                      <ContextMenuPositioner
                        side="right"
                        align="start"
                        sideOffset={4}
                      >
                        <ContextMenuPopup className="min-w-[unset] p-1">
                          <ContextMenuViewport className="flex max-h-none max-w-[11rem] flex-row flex-wrap gap-1 overflow-visible">
                            {FOLDER_TINT_SWATCH_PRESETS.map((preset) => (
                              <ContextMenuItem
                                key={preset.id}
                                className="size-8 shrink-0 justify-center p-0"
                                label={t(
                                  FOLDER_TINT_PRESET_LABEL_KEY[preset.id],
                                )}
                                onClick={() => {
                                  void clientUpdateFolderTint({
                                    folderId: folder.id,
                                    nextPersistedTint: preset.persistedTint,
                                    previousPersistedTint: folder.tint ?? null,
                                    userId,
                                    notaProEntitled,
                                    patchFolderInList,
                                  });
                                }}
                              >
                                <TintCircle
                                  colour={preset.swatchColour}
                                  sizePx={18}
                                  aria-label={t(
                                    FOLDER_TINT_PRESET_LABEL_KEY[preset.id],
                                  )}
                                />
                              </ContextMenuItem>
                            ))}
                          </ContextMenuViewport>
                        </ContextMenuPopup>
                      </ContextMenuPositioner>
                    </ContextMenuPortal>
                  </ContextMenuSubmenuRoot>
                ) : null}
                <ContextMenuItem
                  label={`${t('Delete folder')} ${folder.name}`}
                  onClick={() => {
                    setFolderDeleteTarget(folder);
                  }}
                >
                  <Icon
                    name="trash"
                    size={16}
                    className="shrink-0 text-destructive"
                  />
                  <span className="text-destructive">{t('Delete folder')}</span>
                </ContextMenuItem>
              </ContextMenuViewport>
            </ContextMenuPopup>
          </ContextMenuPositioner>
        </ContextMenuPortal>
      </ContextMenu>
      {children}
    </li>
  );
}

export function NotesSidebarList({
  notes,
  folders,
  panel,
  routeNoteId,
  userId,
  notaProEntitled,
  userPreferences,
  insertNoteAtFront,
  insertFolderSorted,
  patchNoteInList,
  patchFolderInList,
  removeNoteFromList,
  removeFolderFromList,
  refreshNotesList,
}: NotesSidebarListProps): JSX.Element {
  const uid = userId ?? '';
  const { t } = useNotesChromeTranslator();
  const pathSep = t(' / ');
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const folderRoots = useMemo(() => buildFolderTree(folders), [folders]);
  const rootNotes = useMemo(
    () => [...notes].filter((n) => n.folder_id == null).sort(compareNoteTitles),
    [notes],
  );
  const folderMoveTargets = useMemo(
    () =>
      flattenFoldersWithPathLabels(folders, pathSep).map(
        ({ folder: f, pathLabel }) => ({
          folderId: f.id,
          pathLabel,
        }),
      ),
    [folders, pathSep],
  );

  const expandFolderAncestors = useNotesSidebarStore(
    (s) => s.expandFolderAncestors,
  );
  const collapsedFolderIds = useNotesSidebarStore((s) => s.collapsedFolderIds);
  const pruneCollapsedFolderIds = useNotesSidebarStore(
    (s) => s.pruneCollapsedFolderIds,
  );
  const toggleFolderCollapsed = useNotesSidebarStore(
    (s) => s.toggleFolderCollapsed,
  );

  const [folderDeleteTarget, setFolderDeleteTarget] = useState<Folder | null>(
    null,
  );
  const [folderCreateOpen, setFolderCreateOpen] = useState(false);
  const [folderCreateParentId, setFolderCreateParentId] = useState<
    string | null
  >(null);
  const [pendingNewFolderNote, setPendingNewFolderNote] = useState<{
    noteId: string;
  } | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [folderRenameDraft, setFolderRenameDraft] = useState('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const validFolderIdList = useMemo(() => folders.map((f) => f.id), [folders]);
  useEffect(() => {
    pruneCollapsedFolderIds(validFolderIdList);
  }, [pruneCollapsedFolderIds, validFolderIdList]);

  useEffect(() => {
    if (!renamingFolderId || !renameInputRef.current) {
      return;
    }
    const input = renameInputRef.current;
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, [renamingFolderId]);

  // Expand the folder when the user opens a note inside a collapsed section (e.g. palette, graph),
  // not when they manually collapse with the same note open: deps omit collapsed state on purpose.
  useEffect(() => {
    if (panel !== 'note' || !routeNoteId) {
      return;
    }
    const note = notes.find((n) => n.id === routeNoteId);
    const folderId = note?.folder_id ?? null;
    if (!folderId) {
      return;
    }
    const chain = [...ancestorFolderIds(folderId, folders), folderId];
    const collapsed = useNotesSidebarStore.getState().collapsedFolderIds;
    const needsExpand = chain.filter((id) => collapsed.includes(id));
    if (needsExpand.length === 0) {
      return;
    }
    expandFolderAncestors(needsExpand);
  }, [panel, routeNoteId, notes, folders, expandFolderAncestors]);

  const vaultEmpty = notes.length === 0 && folders.length === 0;

  const clearDragState = useCallback(() => {
    setDraggedNoteId(null);
    setDropTargetId(null);
  }, []);

  const moveNoteToFolder = useCallback(
    async (
      noteId: string,
      targetFolderId: string | null,
      options?: { clearDragStateAfter?: boolean },
    ): Promise<void> => {
      const note = notes.find((value) => value.id === noteId);
      if (!note) {
        if (options?.clearDragStateAfter) {
          clearDragState();
        }
        return;
      }

      const previousFolderId = note.folder_id ?? null;
      if (previousFolderId === targetFolderId) {
        if (options?.clearDragStateAfter) {
          clearDragState();
        }
        return;
      }

      patchNoteInList(note.id, { folder_id: targetFolderId });

      if (options?.clearDragStateAfter) {
        clearDragState();
      }

      await clientMoveNoteToFolder({
        noteId: note.id,
        targetFolderId,
        previousFolderId,
        userId: uid,
        notaProEntitled,
        userPreferences,
        patchNoteInList,
        removeFolderFromList,
        refreshNotesList,
      });
    },
    [
      clearDragState,
      notes,
      notaProEntitled,
      patchNoteInList,
      refreshNotesList,
      removeFolderFromList,
      uid,
      userPreferences,
    ],
  );

  const moveDraggedNoteToFolder = useCallback(
    async (targetFolderId: string | null): Promise<void> => {
      if (!draggedNoteId) {
        return;
      }
      await moveNoteToFolder(draggedNoteId, targetFolderId, {
        clearDragStateAfter: true,
      });
    },
    [draggedNoteId, moveNoteToFolder],
  );

  const startCreatingFolderForNote = useCallback((note: Note): void => {
    setFolderCreateParentId(null);
    setPendingNewFolderNote({
      noteId: note.id,
    });
    setFolderCreateOpen(true);
  }, []);

  const openCreateFolderDialog = useCallback(
    (parentFolderId: string | null) => {
      setFolderCreateParentId(parentFolderId);
      setFolderCreateOpen(true);
    },
    [],
  );

  const createNoteAtFolder = useCallback(
    (folderId: string | null): void => {
      if (!notaProEntitled || !uid) {
        return;
      }
      if (folderId !== null) {
        const chain = [...ancestorFolderIds(folderId, folders), folderId];
        expandFolderAncestors(chain);
      }
      void clientCreateNote({
        userId: uid,
        folderId,
        insertNoteAtFront,
        refreshNotesList,
        notaProEntitled,
        notes,
      });
    },
    [
      expandFolderAncestors,
      folders,
      insertNoteAtFront,
      notaProEntitled,
      notes,
      refreshNotesList,
      uid,
    ],
  );

  const handleNewFolderCreated = useCallback(
    async (folder: Folder): Promise<void> => {
      const pending = pendingNewFolderNote;
      setPendingNewFolderNote(null);
      if (!pending) {
        return;
      }
      await moveNoteToFolder(pending.noteId, folder.id);
    },
    [moveNoteToFolder, pendingNewFolderNote],
  );

  const startRenamingFolder = useCallback(
    (folder: Folder): void => {
      const chain = [...ancestorFolderIds(folder.id, folders), folder.id];
      expandFolderAncestors(chain);
      setRenamingFolderId(folder.id);
      setFolderRenameDraft(folder.name);
    },
    [expandFolderAncestors, folders],
  );

  const stopRenamingFolder = useCallback((): void => {
    setRenamingFolderId(null);
    setFolderRenameDraft('');
  }, []);

  const commitFolderRename = useCallback(
    (folder: Folder): void => {
      const nextName = folderRenameDraft.trim();
      const previousName = folder.name;
      stopRenamingFolder();
      if (!nextName || nextName === previousName) {
        return;
      }
      void clientRenameFolder({
        folderId: folder.id,
        previousName,
        nextName,
        userId: uid,
        notaProEntitled,
        patchFolderInList,
      });
    },
    [
      folderRenameDraft,
      notaProEntitled,
      patchFolderInList,
      stopRenamingFolder,
      uid,
    ],
  );

  useEffect(() => {
    const onRenameRequest = (event: Event): void => {
      const customEvent = event as CustomEvent<RenameFolderRequestDetail>;
      const folderId = customEvent.detail.folderId;
      if (!folderId) {
        return;
      }
      const folder = folders.find((value) => value.id === folderId);
      if (!folder) {
        return;
      }
      startRenamingFolder(folder);
    };

    window.addEventListener(NOTA_RENAME_FOLDER_REQUEST_EVENT, onRenameRequest);
    return () => {
      window.removeEventListener(
        NOTA_RENAME_FOLDER_REQUEST_EVENT,
        onRenameRequest,
      );
    };
  }, [folders, startRenamingFolder]);

  const renderFolderTreeNode = (node: FolderTreeNode): JSX.Element => {
    const { folder, children } = node;
    const folderContentId = `sidebar-folder-${folder.id}`;
    const isCollapsed = collapsedFolderIds.includes(folder.id);
    const isDropTarget = dropTargetId === folder.id;
    const notesInFolder = notes
      .filter((n) => n.folder_id === folder.id)
      .sort(compareNoteTitles);

    return (
      <FolderRow
        folder={folder}
        folderContentId={folderContentId}
        isCollapsed={isCollapsed}
        isDropTarget={isDropTarget}
        draggedNoteId={draggedNoteId}
        setDraggedNoteId={setDraggedNoteId}
        setDropTargetId={setDropTargetId}
        toggleFolderCollapsed={toggleFolderCollapsed}
        renamingFolderId={renamingFolderId}
        folderRenameDraft={folderRenameDraft}
        renameInputRef={renameInputRef}
        setFolderRenameDraft={setFolderRenameDraft}
        commitFolderRename={commitFolderRename}
        stopRenamingFolder={stopRenamingFolder}
        startRenamingFolder={startRenamingFolder}
        setFolderDeleteTarget={(value) => {
          setFolderDeleteTarget(value);
        }}
        moveDraggedNoteToFolder={moveDraggedNoteToFolder}
        onRequestNewSubfolder={(f) => {
          openCreateFolderDialog(f.id);
        }}
        onCreateNoteInFolder={(folderId) => {
          createNoteAtFolder(folderId);
        }}
        userId={uid}
        notaProEntitled={notaProEntitled}
        patchFolderInList={patchFolderInList}
      >
        <div
          id={folderContentId}
          className={cn(NOTA_SIDEBAR_TREE_BRANCH_CLASS, 'min-w-0 pb-1')}
          role="group"
          data-expanded={!isCollapsed}
          aria-hidden={isCollapsed}
          inert={isCollapsed ? true : undefined}
        >
          <div className={NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS}>
            {notesInFolder.length === 0 && children.length === 0 ? (
              <p
                className={cn(
                  'ml-5 py-2 text-muted-foreground text-xs',
                  NOTA_TRACKING_CHROME_XS_CLASS,
                )}
              >
                {t('No notes in this folder.')}
              </p>
            ) : (
              <ul className="m-0 list-none p-0">
                {children.map((child) => (
                  <Fragment key={child.folder.id}>
                    {renderFolderTreeNode(child)}
                  </Fragment>
                ))}
                {notesInFolder.map((n) => (
                  <NoteRow
                    key={n.id}
                    note={n}
                    nested
                    isActive={panel === 'note' && routeNoteId === n.id}
                    userId={uid}
                    notaProEntitled={notaProEntitled}
                    userPreferences={userPreferences}
                    removeNoteFromList={removeNoteFromList}
                    removeFolderFromList={removeFolderFromList}
                    refreshNotesList={refreshNotesList}
                    draggedNoteId={draggedNoteId}
                    setDraggedNoteId={setDraggedNoteId}
                    setDropTargetId={setDropTargetId}
                    folderMoveTargets={folderMoveTargets}
                    onMoveNoteToFolder={moveNoteToFolder}
                    onMoveNoteToNewFolder={startCreatingFolderForNote}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </FolderRow>
    );
  };

  if (vaultEmpty) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        ⌘K to start
      </div>
    );
  }

  return (
    <>
      <ul
        className="relative m-0 list-none space-y-0.5 overflow-hidden p-2"
        role="tree"
      >
        {folderRoots.map((node) => (
          <Fragment key={node.folder.id}>{renderFolderTreeNode(node)}</Fragment>
        ))}

        <li className="list-none">
          <ContextMenu>
            <ContextMenuTrigger
              render={
                <div
                  className={cn(
                    'min-h-0',
                    dropTargetId === 'root' &&
                      notesSidebarTreeRowVariants({ dragOver: true }),
                  )}
                  onDragEnter={(event) => {
                    if (!draggedNoteId) {
                      return;
                    }
                    event.preventDefault();
                    setDropTargetId('root');
                  }}
                  onDragOver={(event) => {
                    if (!draggedNoteId) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDropTargetId('root');
                  }}
                  onDragLeave={(event) => {
                    if (
                      event.relatedTarget instanceof Node &&
                      event.currentTarget.contains(event.relatedTarget)
                    ) {
                      return;
                    }
                    setDropTargetId((current) =>
                      current === 'root' ? null : current,
                    );
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void moveDraggedNoteToFolder(null);
                  }}
                >
                  {rootNotes.length > 0 ? (
                    <ul className="m-0 list-none space-y-0.5 p-0">
                      {rootNotes.map((note) => (
                        <NoteRow
                          key={note.id}
                          note={note}
                          isActive={panel === 'note' && routeNoteId === note.id}
                          userId={uid}
                          notaProEntitled={notaProEntitled}
                          userPreferences={userPreferences}
                          removeNoteFromList={removeNoteFromList}
                          removeFolderFromList={removeFolderFromList}
                          refreshNotesList={refreshNotesList}
                          draggedNoteId={draggedNoteId}
                          setDraggedNoteId={setDraggedNoteId}
                          setDropTargetId={setDropTargetId}
                          folderMoveTargets={folderMoveTargets}
                          onMoveNoteToFolder={moveNoteToFolder}
                          onMoveNoteToNewFolder={startCreatingFolderForNote}
                        />
                      ))}
                    </ul>
                  ) : draggedNoteId ? (
                    <p
                      className={cn(
                        'px-3 py-2 text-xs text-muted-foreground',
                        NOTA_TRACKING_CHROME_XS_CLASS,
                      )}
                    >
                      Drop here to move to root.
                    </p>
                  ) : null}
                </div>
              }
            />
            {notaProEntitled ? (
              <ContextMenuPortal>
                <ContextMenuPositioner
                  side="right"
                  align="start"
                  sideOffset={4}
                >
                  <ContextMenuPopup>
                    <ContextMenuViewport>
                      <ContextMenuItem
                        label={t('Create note')}
                        onClick={() => {
                          createNoteAtFolder(null);
                        }}
                      >
                        <Icon
                          name="user-plus"
                          size={16}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span>{t('Create note')}</span>
                      </ContextMenuItem>
                      <ContextMenuItem
                        label={t('Create folder')}
                        onClick={() => {
                          openCreateFolderDialog(null);
                        }}
                      >
                        <Icon
                          name="user-plus"
                          size={16}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span>{t('Create folder')}</span>
                      </ContextMenuItem>
                    </ContextMenuViewport>
                  </ContextMenuPopup>
                </ContextMenuPositioner>
              </ContextMenuPortal>
            ) : null}
          </ContextMenu>
        </li>
      </ul>

      <FolderCreateDialog
        open={folderCreateOpen}
        onOpenChange={(next) => {
          setFolderCreateOpen(next);
          if (!next) {
            setPendingNewFolderNote(null);
            setFolderCreateParentId(null);
          }
        }}
        userId={uid}
        parentFolderId={folderCreateParentId}
        insertFolderSorted={insertFolderSorted}
        refreshNotesList={refreshNotesList}
        onCreated={handleNewFolderCreated}
      />

      <FolderDeleteDialog
        folder={folderDeleteTarget}
        allFolders={folders}
        open={folderDeleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) {
            setFolderDeleteTarget(null);
          }
        }}
        removeNoteFromList={removeNoteFromList}
        removeFolderFromList={removeFolderFromList}
        refreshNotesList={refreshNotesList}
      />
    </>
  );
}
