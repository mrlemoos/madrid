import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useRef,
  useState,
  type JSX,
} from 'react';
import { Dialog } from '@base-ui/react/dialog';
import type { DialogRoot } from '@base-ui/react/dialog';
import { Command, defaultFilter } from 'cmdk';
import { Icon, type IconName } from '@nota/design/icon';
import { cn } from '@nota/design/utils';
import {
  notaKbdFooterClass,
  notaKbdHintClass,
} from '@nota/note-palette-core/nota-kbd-styles';
import { useNoteEditorCommands } from '@nota/editor';
import { useRootLoaderData } from '@nota/note-runtime/session-context';
import { useNotesData } from '@nota/note-runtime/notes-data-context';
import { useAppNavigationScreen } from '@nota/app-navigation-ui/use-app-navigation-screen';
import { openTodaysNoteClient } from '@nota/app-navigation-ui/open-todays-note';
import {
  navigateFromLegacyPath,
  navigateToScreen,
} from '@nota/app-navigation-core/navigation';
import { NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT } from '@nota/electron-bridge-core/menubar-events';
import { useClerk } from '@clerk/react';
import { clientCreateNote } from '@nota/note-folders-ui/create-note-client';
import { clientDeleteNoteById } from '@nota/note-folders-ui/delete-note-client';
import { clientMoveNoteToFolder } from '@nota/note-folders-ui/move-note-folder-client';
import { dispatchRenameFolderRequest } from '@nota/note-folders-ui/folder-rename-request';
import { useMetaShortcutKey } from '@nota/helper-hooks';
import { movePickEnterAction } from '@nota/note-palette-core/move-pick-enter';
import {
  parseMovePickNoteId,
  readHighlightedCmdkItemValue,
  readMovePickNoteIdFromHighlightedItem,
} from '@nota/note-palette-core/move-pick-helpers';
import type { Folder } from '@nota/database-types';
import { useNotaTranslator } from './use-palette-translator';
import { flattenFoldersWithPathLabels } from '@nota/note-folders-core/folder-tree';
import { hasJournalNotes } from '@nota/note-journal-core/notes';
import {
  FOLDER_TINT_PALETTE_PRESETS,
  FOLDER_TINT_PRESET_LABEL_KEY,
} from '@nota/note-folders-core/folder-tint-presets';
import { clientUpdateFolderTint } from '@nota/note-folders-ui/update-folder-tint-client';
import { FolderCreateDialog } from '@nota/note-folders-ui/folder-create-dialog';
import { FolderDeleteDialog } from '@nota/note-folders-ui/folder-delete-dialog';
import { ReleaseNotesDialog } from '@nota/electron-bridge-ui/release-notes-dialog';
import {
  startStudyNotesAppendToOpenNote,
  startStudyNotesFromRecording,
} from '@nota/note-capture-ui/audio-to-note-start';
import { useNotaPreferencesStore } from '@nota/note-runtime/stores/preferences';
import { useTheme } from '@nota/design/theme';
import { TintCircle } from '@nota/design/nota-tint-circle';
import { CommandPaletteSemanticSync } from './command-palette-semantic-sync';
import { NOTA_CMDK_ITEM_CLASS } from '@nota/nota-motion-ui/interaction';
import {
  initialPaletteMode,
  moveCommandGroupHeading as selectMoveHeading,
  moveTargetNoteIds as selectMoveTargetNoteIds,
  paletteModeReducer,
} from '@nota/note-palette-core/palette-mode';
import {
  buildAppearanceCommands,
  buildZoomCommands,
  type PaletteActionCommand,
} from '@nota/note-palette-core/palette-commands';
import { useNotaZoomStore } from '@nota/note-runtime/stores/zoom';

const PALETTE_EMPTY_ID_SET: ReadonlySet<string> = new Set();

const groupHeadingClassName =
  'px-1 py-1 text-muted-foreground text-xs [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5';

const commandItemRowClass = cn(
  NOTA_CMDK_ITEM_CLASS,
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none select-none',
);

/** Scrollable list: keep overflow but hide scrollbar (WebKit / Firefox / legacy Edge). */
const commandListClassName = cn(
  'max-h-72 overflow-y-auto p-1',
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
);

function pickCreateNoteFolderId(
  pickerOpen: boolean,
  paletteValue: string,
): string | undefined {
  if (!pickerOpen) {
    return undefined;
  }
  if (!paletteValue.startsWith('new-note-f:')) {
    return undefined;
  }
  const tail = paletteValue.slice('new-note-f:'.length);
  if (tail === 'root') {
    return undefined;
  }
  return tail;
}

function PaletteItemIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}): JSX.Element {
  return (
    <span aria-hidden className={cn('inline-flex shrink-0', className)}>
      <Icon name={name} size={16} />
    </span>
  );
}

/** Renders one flat palette command (see `PaletteActionCommand`). */
function PaletteActionItem({
  command,
}: {
  command: PaletteActionCommand;
}): JSX.Element {
  const destructive = command.tone === 'destructive';
  return (
    <Command.Item
      value={command.value}
      keywords={command.keywords}
      onSelect={command.run}
      className={cn(
        commandItemRowClass,
        destructive ? 'group text-destructive' : 'group text-foreground',
        destructive
          ? 'aria-selected:bg-destructive/15 aria-selected:text-destructive'
          : 'aria-selected:bg-accent aria-selected:text-accent-foreground',
      )}
    >
      <PaletteItemIcon
        name={command.icon}
        className={
          destructive
            ? 'text-destructive group-aria-selected:text-destructive'
            : 'text-muted-foreground group-aria-selected:text-accent-foreground'
        }
      />
      <span className="min-w-0 flex-1">{command.label}</span>
      {command.current ? (
        <span className="shrink-0 text-muted-foreground text-xs">
          (current)
        </span>
      ) : null}
    </Command.Item>
  );
}

export function CommandPalette(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [semanticOrderedIds, setSemanticOrderedIds] = useState<string[] | null>(
    null,
  );
  const [semanticSearchLoading, setSemanticSearchLoading] = useState(false);
  const dialogActionsRef = useRef<DialogRoot.Actions | null>(null);
  const screen = useAppNavigationScreen();
  const activeNoteId =
    screen.kind === 'notes' && screen.panel === 'note' ? screen.noteId : null;
  const {
    notes,
    folders,
    notaProEntitled,
    userPreferences,
    refreshNotesList,
    insertNoteAtFront,
    insertFolderSorted,
    patchNoteInList,
    removeNoteFromList,
    removeFolderFromList,
    patchFolderInList,
  } = useNotesData();
  const { t } = useNotaTranslator();
  const pathSep = t(' / ');
  const foldersWithPaths = useMemo(
    () => flattenFoldersWithPathLabels(folders, pathSep),
    [folders, pathSep],
  );
  const showJournalCommand = hasJournalNotes(notes);
  const { user } = useRootLoaderData();
  const { signOut } = useClerk();
  const openTodaysNoteShortcut = useNotaPreferencesStore(
    (s) => s.openTodaysNoteShortcut,
  );
  const [busyAction, setBusyAction] = useState<
    'create' | 'delete' | 'logout' | 'moveNotes' | null
  >(null);
  const busy = busyAction !== null;
  const { theme, setTheme } = useTheme();
  const {
    insertMermaidAtCursor,
    canInsertMermaid,
    insertTableAtCursor,
    canInsertTable,
    insertTaskListAtCursor,
    canInsertTaskList,
  } = useNoteEditorCommands();
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const { formatShortcut } = useMetaShortcutKey();
  const [openingTodaysNote, setOpeningTodaysNote] = useState(false);
  const [startingAudioNote, setStartingAudioNote] = useState(false);
  const [paletteValue, setPaletteValue] = useState('');
  /** cmdk search box; distinct from `paletteValue` (selected `Command.Item` value). */
  const [paletteSearch, setPaletteSearch] = useState('');
  const [newNoteFolderPickerOpen, setNewNoteFolderPickerOpen] = useState(false);
  const [folderCreateDlgOpen, setFolderCreateDlgOpen] = useState(false);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<Folder | null>(
    null,
  );
  const [paletteMode, dispatchPaletteMode] = useReducer(
    paletteModeReducer,
    initialPaletteMode,
  );
  // Derive the legacy flag names from the single exclusive mode so read sites
  // stay untouched; only mode transitions go through `dispatchPaletteMode`.
  const moveFlow: 'idle' | 'pickNote' | 'pickFolder' =
    paletteMode.kind === 'movePickNote'
      ? 'pickNote'
      : paletteMode.kind === 'movePickFolder'
        ? 'pickFolder'
        : 'idle';
  const moveMultiSelectActive =
    paletteMode.kind === 'movePickNote' ? paletteMode.multiSelect : false;
  const moveSelectedNoteIds =
    paletteMode.kind === 'movePickNote'
      ? paletteMode.selected
      : PALETTE_EMPTY_ID_SET;
  const moveTargetNoteIds = selectMoveTargetNoteIds(paletteMode);
  const deleteFolderPickerOpen = paletteMode.kind === 'deleteFolderPick';
  const renameFolderPickerOpen = paletteMode.kind === 'renameFolderPick';
  const tintFolderFlow: 'idle' | 'pickFolder' | 'pickColour' =
    paletteMode.kind === 'tintFolderPick'
      ? 'pickFolder'
      : paletteMode.kind === 'tintColourPick'
        ? 'pickColour'
        : 'idle';
  const tintFolderId =
    paletteMode.kind === 'tintColourPick' ? paletteMode.folderId : null;
  const moveSelectedNoteIdsRef = useRef(moveSelectedNoteIds);
  moveSelectedNoteIdsRef.current = moveSelectedNoteIds;
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);

  useEffect(() => {
    function onMoveNoteRequest(): void {
      if (!user?.id || !notaProEntitled) {
        return;
      }
      setOpen(true);
      setBusyAction(null);
      setNewNoteFolderPickerOpen(false);
      setFolderCreateDlgOpen(false);
      setFolderDeleteTarget(null);
      dispatchPaletteMode({ type: 'startMovePickNote' });
      setPaletteValue('');
      setPaletteSearch('');
    }

    window.addEventListener(
      NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT,
      onMoveNoteRequest,
    );
    return () => {
      window.removeEventListener(
        NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT,
        onMoveNoteRequest,
      );
    };
  }, [notaProEntitled, user?.id]);

  const semanticSearchUserPref = useNotaPreferencesStore(
    (s) => s.semanticSearchEnabled,
  );
  const notaServerUrl =
    typeof process.env.NEXT_PUBLIC_NOTA_SERVER_API_URL === 'string'
      ? process.env.NEXT_PUBLIC_NOTA_SERVER_API_URL.trim()
      : '';
  const semanticSearchEnabled =
    notaProEntitled && notaServerUrl.length > 0 && semanticSearchUserPref;

  const handleSemanticOrderedIds = useCallback((ids: string[] | null) => {
    setSemanticOrderedIds(ids);
  }, []);

  const handleSemanticLoading = useCallback((loading: boolean) => {
    setSemanticSearchLoading(loading);
  }, []);

  useEffect(() => {
    if (!open) {
      setSemanticOrderedIds(null);
      setSemanticSearchLoading(false);
      setNewNoteFolderPickerOpen(false);
      setPaletteValue('');
      setPaletteSearch('');
      dispatchPaletteMode({ type: 'reset' });
      setFolderDeleteTarget(null);
    }
  }, [open]);

  useEffect(() => {
    if (moveFlow === 'pickNote' || moveFlow === 'pickFolder') {
      setPaletteValue('');
      setPaletteSearch('');
    }
  }, [moveFlow]);

  useEffect(() => {
    if (tintFolderFlow === 'pickFolder' || tintFolderFlow === 'pickColour') {
      setPaletteValue('');
      setPaletteSearch('');
    }
  }, [tintFolderFlow]);

  const notesForOpenPalette = useMemo(() => {
    if (semanticOrderedIds === null) {
      return notes;
    }
    return semanticOrderedIds
      .map((id) => notes.find((n) => n.id === id))
      .filter((n): n is (typeof notes)[number] => Boolean(n));
  }, [notes, semanticOrderedIds]);

  const moveCommandGroupHeading = selectMoveHeading(
    paletteMode,
    busyAction === 'moveNotes',
  );

  const commandFilter = useCallback(
    (value: string, search: string, keywords?: string[]) => {
      if (value.startsWith('note-open:')) {
        const id = value.slice('note-open:'.length);
        if (semanticOrderedIds === null) {
          return defaultFilter(value, search, keywords);
        }
        if (semanticOrderedIds.length === 0) {
          return 0;
        }
        return semanticOrderedIds.includes(id) ? 1 : 0;
      }
      return defaultFilter(value, search, keywords);
    },
    [semanticOrderedIds],
  );

  const closePalette = useCallback((): void => {
    dialogActionsRef.current?.close();
  }, []);

  const appearanceCommands = buildAppearanceCommands({
    theme,
    setTheme,
    close: closePalette,
  });

  const zoom = useNotaZoomStore((s) => s.zoom);
  const zoomCommands = buildZoomCommands({
    zoom,
    zoomIn: useNotaZoomStore.getState().zoomIn,
    zoomOut: useNotaZoomStore.getState().zoomOut,
    resetZoom: useNotaZoomStore.getState().resetZoom,
    close: closePalette,
  });

  const completeMoveToTarget = useCallback(
    async (targetFolderId: string | null): Promise<void> => {
      setBusyAction('moveNotes');
      try {
        const ids = [...moveTargetNoteIds];
        for (const nid of ids) {
          const note = notes.find((x) => x.id === nid);
          await clientMoveNoteToFolder({
            noteId: nid,
            targetFolderId,
            previousFolderId: note?.folder_id ?? null,
            userId: user?.id ?? '',
            notaProEntitled,
            userPreferences,
            patchNoteInList,
            removeFolderFromList,
            refreshNotesList,
          });
        }
        dispatchPaletteMode({ type: 'reset' });
        closePalette();
      } finally {
        setBusyAction(null);
      }
    },
    [
      moveTargetNoteIds,
      notes,
      user?.id,
      notaProEntitled,
      userPreferences,
      patchNoteInList,
      removeFolderFromList,
      refreshNotesList,
      closePalette,
    ],
  );

  const handleDialogOpenChange = useCallback((next: boolean): void => {
    setOpen(next);
  }, []);

  const paletteValueRef = useRef('');
  paletteValueRef.current = paletteValue;
  const moveFlowRef = useRef(moveFlow);
  moveFlowRef.current = moveFlow;
  const moveMultiSelectActiveRef = useRef(moveMultiSelectActive);
  moveMultiSelectActiveRef.current = moveMultiSelectActive;
  const newNotePickerOpenRef = useRef(false);
  newNotePickerOpenRef.current = newNoteFolderPickerOpen;

  const onKeyDown = useEffectEvent((e: KeyboardEvent): void => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      if (open) {
        e.preventDefault();
        dialogActionsRef.current?.close();
        return;
      }

      e.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) {
      return;
    }

    if (mod && (e.key === 'n' || e.key === 'N') && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      if (!notaProEntitled) {
        return;
      }
      if (!busy) {
        setBusyAction('create');
        void (async () => {
          try {
            const picked = pickCreateNoteFolderId(
              newNotePickerOpenRef.current,
              paletteValueRef.current,
            );
            await clientCreateNote({
              userId: user?.id ?? '',
              insertNoteAtFront,
              refreshNotesList,
              notaProEntitled,
              notes,
              ...(picked !== undefined ? { folderId: picked } : {}),
            });
            closePalette();
          } finally {
            setBusyAction(null);
          }
        })();
      }
      return;
    }

    if (mod && (e.key === 'm' || e.key === 'M') && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      if (
        !notaProEntitled ||
        busy ||
        moveFlow !== 'idle' ||
        tintFolderFlow !== 'idle'
      ) {
        return;
      }
      dispatchPaletteMode({ type: 'startMovePickNote' });
      return;
    }

    if (e.key === 'Tab' && notaProEntitled) {
      if (newNotePickerOpenRef.current && e.shiftKey) {
        e.preventDefault();
        setNewNoteFolderPickerOpen(false);
        return;
      }
      if (
        !newNotePickerOpenRef.current &&
        !e.shiftKey &&
        paletteValueRef.current === 'create-note'
      ) {
        e.preventDefault();
        setNewNoteFolderPickerOpen(true);
        return;
      }
    }

    if (e.key === ' ') {
      const input = commandInputRef.current;
      const t = e.target;
      // cmdk keeps focus on the search input while arrowing through items, so we must
      // handle move-pick Space *before* the "target is input → bail" branch.
      if (
        moveFlowRef.current === 'pickNote' &&
        !commandInputRef.current?.value.trim()
      ) {
        const paletteRoot =
          commandInputRef.current?.closest('[data-nota-command-palette]') ??
          null;
        const noteId =
          parseMovePickNoteId(paletteValueRef.current) ??
          readMovePickNoteIdFromHighlightedItem(paletteRoot);
        if (noteId) {
          e.preventDefault();
          e.stopPropagation();
          dispatchPaletteMode({ type: 'moveToggleSelect', noteId });
          return;
        }
      }
      if (input && t instanceof Node && (input === t || input.contains(t))) {
        return;
      }
      e.preventDefault();
      input?.focus();
    }

    if (e.key === 'Enter' || e.key === 'NumpadEnter') {
      if (
        moveFlowRef.current === 'pickNote' &&
        moveMultiSelectActiveRef.current
      ) {
        const trimmed = commandInputRef.current?.value.trim() ?? '';
        const paletteRoot =
          commandInputRef.current?.closest('[data-nota-command-palette]') ??
          null;
        const highlightedValue =
          paletteValueRef.current ||
          readHighlightedCmdkItemValue(paletteRoot) ||
          '';
        const action = movePickEnterAction({
          moveFlow: moveFlowRef.current,
          moveMultiSelectActive: moveMultiSelectActiveRef.current,
          searchTrimmed: trimmed,
          highlightedValue,
          selectedCount: moveSelectedNoteIdsRef.current.size,
        });
        if (action.kind === 'advanceToFolder') {
          e.preventDefault();
          e.stopPropagation();
          dispatchPaletteMode({
            type: 'moveAdvanceToFolder',
            targetNoteIds: Array.from(moveSelectedNoteIdsRef.current),
          });
          return;
        }
        if (action.kind === 'noop') {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
  });

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [onKeyDown]);

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={handleDialogOpenChange}
        actionsRef={dialogActionsRef}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={cn('fixed inset-0 z-50 bg-black/40')} />
          <Dialog.Popup
            data-nota-command-palette
            inert={folderCreateDlgOpen || undefined}
            className={cn(
              'fixed top-[15%] left-1/2 z-50 w-[min(100vw-2rem,28rem)] -translate-x-1/2 outline-none',
              'rounded-lg bg-background/55 text-foreground shadow-lg',
              'backdrop-blur-xl backdrop-saturate-150',
            )}
          >
            <Dialog.Title className="sr-only">Command palette</Dialog.Title>
            <Dialog.Description className="sr-only">
              Search commands and notes. Use arrow keys to move, Enter to run.
              Quoted phrases match note text literally; other text uses Semantic
              Search when Nota Pro is active.
            </Dialog.Description>
            <Command
              className="overflow-hidden"
              label="Command palette"
              vimBindings={false}
              filter={commandFilter}
              value={paletteValue}
              onValueChange={setPaletteValue}
            >
              <CommandPaletteSemanticSync
                enabled={semanticSearchEnabled && open}
                onSemanticOrderedIds={handleSemanticOrderedIds}
                onLoadingChange={handleSemanticLoading}
              />
              <Command.Input
                ref={commandInputRef}
                value={paletteSearch}
                onValueChange={setPaletteSearch}
                placeholder={
                  semanticSearchEnabled
                    ? 'Commands and Semantic Search: use quotes for exact phrases…'
                    : 'Type a command…'
                }
                className={cn(
                  'w-full bg-transparent px-3 py-3 text-sm',
                  'text-foreground outline-none placeholder:text-muted-foreground',
                )}
              />
              <Command.List className={commandListClassName}>
                {notaProEntitled && moveFlow !== 'idle' ? (
                  <Command.Group
                    heading={moveCommandGroupHeading}
                    className={groupHeadingClassName}
                  >
                    {moveFlow === 'pickNote'
                      ? notesForOpenPalette.map((n) => {
                          const selected = moveSelectedNoteIds.has(n.id);
                          return (
                            <Command.Item
                              key={`move-pick-${n.id}`}
                              value={`move-pick:${n.id}`}
                              keywords={['move', 'folder', n.title]}
                              onSelect={() => {
                                if (moveMultiSelectActive) {
                                  return;
                                }
                                dispatchPaletteMode({
                                  type: 'moveAdvanceToFolder',
                                  targetNoteIds: [n.id],
                                });
                              }}
                              aria-checked={
                                moveMultiSelectActive ? selected : undefined
                              }
                              className={cn(
                                commandItemRowClass,
                                'group text-foreground',
                                'aria-selected:bg-accent aria-selected:text-accent-foreground',
                              )}
                            >
                              {moveMultiSelectActive ? (
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={selected}
                                  tabIndex={-1}
                                  className={cn(
                                    'inline-flex size-4 shrink-0 items-center justify-center rounded border border-border text-muted-foreground outline-none',
                                    selected &&
                                      'border-primary bg-primary text-primary-foreground',
                                  )}
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    dispatchPaletteMode({
                                      type: 'moveToggleSelect',
                                      noteId: n.id,
                                    });
                                  }}
                                  onPointerDown={(ev) => {
                                    ev.stopPropagation();
                                  }}
                                >
                                  {selected ? (
                                    <Icon name="simple-checked" size={12} />
                                  ) : null}
                                </button>
                              ) : null}
                              <span className="min-w-0 flex-1 truncate">
                                {n.title || 'Untitled Note'}
                              </span>
                            </Command.Item>
                          );
                        })
                      : null}
                    {moveFlow === 'pickNote' && moveMultiSelectActive ? (
                      <Command.Item
                        value="move-pick-continue"
                        disabled={moveSelectedNoteIds.size === 0}
                        keywords={[
                          'continue',
                          'choose',
                          'folder',
                          'destination',
                          'next',
                        ]}
                        onSelect={() => {
                          dispatchPaletteMode({
                            type: 'moveAdvanceToFolder',
                            targetNoteIds: Array.from(moveSelectedNoteIds),
                          });
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                          'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          {moveSelectedNoteIds.size === 0
                            ? 'Choose folder for selected notes…'
                            : `Choose folder for ${String(moveSelectedNoteIds.size)} note${moveSelectedNoteIds.size === 1 ? '' : 's'}…`}
                        </span>
                      </Command.Item>
                    ) : null}
                    {moveFlow === 'pickFolder' &&
                    moveTargetNoteIds.length > 0 ? (
                      <>
                        <Command.Item
                          value="move-to:root"
                          disabled={busyAction === 'moveNotes'}
                          keywords={['root', 'default', 'move']}
                          onSelect={() => {
                            void completeMoveToTarget(null);
                          }}
                          className={cn(
                            commandItemRowClass,
                            'group text-foreground',
                            'aria-selected:bg-accent aria-selected:text-accent-foreground',
                            'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                          )}
                        >
                          <span className="min-w-0 flex-1">No folder</span>
                        </Command.Item>
                        {foldersWithPaths.map(({ folder: f, pathLabel }) => (
                          <Command.Item
                            key={`move-to-${f.id}`}
                            value={`move-to:${f.id}`}
                            disabled={busyAction === 'moveNotes'}
                            keywords={[
                              'move',
                              f.name,
                              pathLabel,
                              ...pathLabel.split(pathSep).map((s) => s.trim()),
                            ]}
                            onSelect={() => {
                              void completeMoveToTarget(f.id);
                            }}
                            className={cn(
                              commandItemRowClass,
                              'group text-foreground',
                              'aria-selected:bg-accent aria-selected:text-accent-foreground',
                              'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {pathLabel}
                            </span>
                          </Command.Item>
                        ))}
                      </>
                    ) : null}
                    <Command.Item
                      value="move-cancel"
                      disabled={
                        moveFlow === 'pickFolder' && busyAction === 'moveNotes'
                      }
                      keywords={['cancel', 'back']}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'reset' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-muted-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      Cancel
                    </Command.Item>
                  </Command.Group>
                ) : null}
                {notaProEntitled && deleteFolderPickerOpen ? (
                  <Command.Group
                    heading="Delete folder: pick folder"
                    className={groupHeadingClassName}
                  >
                    {foldersWithPaths.map(({ folder: f, pathLabel }) => (
                      <Command.Item
                        key={`del-pick-${f.id}`}
                        value={`del-pick:${f.id}`}
                        keywords={[
                          'delete',
                          'folder',
                          f.name,
                          pathLabel,
                          ...pathLabel.split(pathSep).map((s) => s.trim()),
                        ]}
                        onSelect={() => {
                          setFolderDeleteTarget(f);
                          dispatchPaletteMode({ type: 'reset' });
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {pathLabel}
                        </span>
                      </Command.Item>
                    ))}
                    <Command.Item
                      value="del-pick-cancel"
                      keywords={['cancel']}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'reset' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-muted-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      Cancel
                    </Command.Item>
                  </Command.Group>
                ) : null}
                {notaProEntitled && renameFolderPickerOpen ? (
                  <Command.Group
                    heading="Rename folder: pick folder"
                    className={groupHeadingClassName}
                  >
                    {foldersWithPaths.map(({ folder: f, pathLabel }) => (
                      <Command.Item
                        key={`rename-pick-${f.id}`}
                        value={`rename-pick:${f.id}`}
                        keywords={[
                          'rename',
                          'folder',
                          f.name,
                          pathLabel,
                          ...pathLabel.split(pathSep).map((s) => s.trim()),
                        ]}
                        onSelect={() => {
                          dispatchPaletteMode({ type: 'reset' });
                          closePalette();
                          dispatchRenameFolderRequest(f.id);
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {pathLabel}
                        </span>
                      </Command.Item>
                    ))}
                    <Command.Item
                      value="rename-pick-cancel"
                      keywords={['cancel']}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'reset' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-muted-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      Cancel
                    </Command.Item>
                  </Command.Group>
                ) : null}
                {notaProEntitled && tintFolderFlow === 'pickFolder' ? (
                  <Command.Group
                    heading={t('Tint folder: pick folder')}
                    className={groupHeadingClassName}
                  >
                    {foldersWithPaths.map(({ folder: f, pathLabel }) => (
                      <Command.Item
                        key={`tint-pick-${f.id}`}
                        value={`tint-pick:${f.id}`}
                        keywords={[
                          'tint',
                          'colour',
                          'color',
                          'folder',
                          f.name,
                          pathLabel,
                          ...pathLabel.split(pathSep).map((s) => s.trim()),
                        ]}
                        onSelect={() => {
                          dispatchPaletteMode({
                            type: 'tintChooseFolder',
                            folderId: f.id,
                          });
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {pathLabel}
                        </span>
                      </Command.Item>
                    ))}
                    <Command.Item
                      value="tint-pick-cancel"
                      keywords={['cancel']}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'reset' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-muted-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      {t('Cancel')}
                    </Command.Item>
                  </Command.Group>
                ) : null}
                {notaProEntitled &&
                tintFolderFlow === 'pickColour' &&
                tintFolderId ? (
                  <Command.Group
                    heading={t('Tint folder: choose colour')}
                    className={groupHeadingClassName}
                  >
                    {FOLDER_TINT_PALETTE_PRESETS.map((preset) => (
                      <Command.Item
                        key={`tint-colour-${preset.id}`}
                        value={`tint-colour:${preset.id}`}
                        keywords={[
                          'tint',
                          'colour',
                          'color',
                          preset.id,
                          preset.persistedTint ?? 'default',
                        ]}
                        onSelect={() => {
                          const previousPersistedTint =
                            folders.find((f) => f.id === tintFolderId)?.tint ??
                            null;
                          void clientUpdateFolderTint({
                            folderId: tintFolderId,
                            nextPersistedTint: preset.persistedTint,
                            previousPersistedTint,
                            userId: user?.id ?? '',
                            notaProEntitled,
                            patchFolderInList,
                          });
                          dispatchPaletteMode({ type: 'reset' });
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        )}
                      >
                        <TintCircle
                          colour={preset.swatchColour}
                          sizePx={16}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          {t(FOLDER_TINT_PRESET_LABEL_KEY[preset.id])}
                        </span>
                      </Command.Item>
                    ))}
                    <Command.Item
                      value="tint-colour-back"
                      keywords={['back', 'cancel']}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'startTintFolderPick' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-muted-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      {t('Back')}
                    </Command.Item>
                  </Command.Group>
                ) : null}
                {notaProEntitled &&
                folderDeleteTarget === null &&
                moveFlow === 'idle' &&
                !renameFolderPickerOpen &&
                !deleteFolderPickerOpen &&
                tintFolderFlow === 'idle' ? (
                  <Command.Group
                    heading="Folders"
                    className={groupHeadingClassName}
                  >
                    <Command.Item
                      value="cmd-create-folder"
                      keywords={['folder', 'new folder', 'add folder']}
                      onSelect={() => {
                        closePalette();
                        setFolderCreateDlgOpen(true);
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      <span className="min-w-0 flex-1">Create folder</span>
                      <span className={notaKbdHintClass}>
                        {formatShortcut({ key: 'N', shift: true })}
                      </span>
                    </Command.Item>
                    <Command.Item
                      value="cmd-move-note"
                      disabled={notesForOpenPalette.length === 0}
                      keywords={['move note', 'folder', 'organise']}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'startMovePickNote' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <span className="min-w-0 flex-1">Move note…</span>
                      <span className={notaKbdHintClass}>
                        {formatShortcut({ key: 'M' })}
                      </span>
                    </Command.Item>
                    <Command.Item
                      value="cmd-rename-folder"
                      disabled={folders.length === 0}
                      keywords={[
                        'rename folder',
                        'edit folder',
                        'change folder name',
                      ]}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'startRenameFolderPick' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <span className="min-w-0 flex-1">Rename folder…</span>
                    </Command.Item>
                    <Command.Item
                      value="cmd-tint-folder"
                      disabled={folders.length === 0}
                      keywords={[
                        'tint folder',
                        'folder tint',
                        'colour folder',
                        'color folder',
                        'folder colour',
                      ]}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'startTintFolderPick' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        {t('Tint folder…')}
                      </span>
                    </Command.Item>
                    <Command.Item
                      value="cmd-delete-folder"
                      disabled={folders.length === 0}
                      keywords={['delete folder', 'remove folder']}
                      onSelect={() => {
                        dispatchPaletteMode({ type: 'startDeleteFolderPick' });
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <span className="min-w-0 flex-1">Delete folder…</span>
                    </Command.Item>
                  </Command.Group>
                ) : null}
                {notaProEntitled ? (
                  <Command.Group
                    heading="Notes"
                    className={groupHeadingClassName}
                  >
                    <Command.Item
                      value="create-note"
                      disabled={
                        busy || moveFlow !== 'idle' || tintFolderFlow !== 'idle'
                      }
                      keywords={['new', 'add']}
                      onSelect={() => {
                        setBusyAction('create');
                        void (async () => {
                          try {
                            await clientCreateNote({
                              userId: user?.id ?? '',
                              insertNoteAtFront,
                              refreshNotesList,
                              notaProEntitled,
                              notes,
                            });
                            closePalette();
                          } finally {
                            setBusyAction(null);
                          }
                        })();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <PaletteItemIcon
                        name="user-plus"
                        className="text-muted-foreground group-aria-selected:text-accent-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        {busy && busyAction === 'create'
                          ? 'Creating note...'
                          : 'Create new note'}
                      </span>
                      <span className={notaKbdHintClass}>
                        {formatShortcut({ key: 'N' })}
                      </span>
                    </Command.Item>
                    {newNoteFolderPickerOpen ? (
                      <Command.Group
                        heading="Folder for new note"
                        className={groupHeadingClassName}
                      >
                        <Command.Item
                          value="new-note-f:root"
                          keywords={['root', 'default', 'folder']}
                          onSelect={() => {
                            void (async () => {
                              setOpeningTodaysNote(true);
                              try {
                                await openTodaysNoteClient({
                                  notes,
                                  userId: user?.id ?? '',
                                  navigate: navigateFromLegacyPath,
                                  revalidate: () => {
                                    void refreshNotesList({ silent: true });
                                  },
                                  notaProEntitled,
                                });
                                closePalette();
                              } finally {
                                setOpeningTodaysNote(false);
                              }
                            })();
                          }}
                          className={cn(
                            commandItemRowClass,
                            'group text-foreground',
                            'aria-selected:bg-accent aria-selected:text-accent-foreground',
                          )}
                        >
                          <span className="min-w-0 flex-1">Today</span>
                        </Command.Item>
                        {foldersWithPaths.map(({ folder: f, pathLabel }) => (
                          <Command.Item
                            key={`new-note-f-${f.id}`}
                            value={`new-note-f:${f.id}`}
                            keywords={[
                              'folder',
                              f.name,
                              pathLabel,
                              'new note',
                              ...pathLabel.split(pathSep).map((s) => s.trim()),
                            ]}
                            onSelect={() => {
                              setBusyAction('create');
                              void (async () => {
                                try {
                                  await clientCreateNote({
                                    userId: user?.id ?? '',
                                    insertNoteAtFront,
                                    refreshNotesList,
                                    notaProEntitled,
                                    notes,
                                    folderId: f.id,
                                  });
                                  closePalette();
                                } finally {
                                  setBusyAction(null);
                                }
                              })();
                            }}
                            className={cn(
                              commandItemRowClass,
                              'group text-foreground',
                              'aria-selected:bg-accent aria-selected:text-accent-foreground',
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {pathLabel}
                            </span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    ) : null}
                    {openTodaysNoteShortcut && user?.id ? (
                      <Command.Item
                        value="open-todays-note"
                        disabled={openingTodaysNote}
                        keywords={['today', 'daily', 'journal', 'date', 'day']}
                        onSelect={() => {
                          void (async () => {
                            setOpeningTodaysNote(true);
                            try {
                              await openTodaysNoteClient({
                                notes,
                                userId: user.id,
                                navigate: navigateFromLegacyPath,
                                revalidate: () => {
                                  void refreshNotesList({ silent: true });
                                },
                                notaProEntitled,
                              });
                              closePalette();
                            } finally {
                              setOpeningTodaysNote(false);
                            }
                          })();
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                          'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                        )}
                      >
                        <PaletteItemIcon
                          name="file-description"
                          className="text-muted-foreground group-aria-selected:text-accent-foreground"
                        />
                        <span className="min-w-0 flex-1">
                          {openingTodaysNote
                            ? 'Opening today’s note…'
                            : 'Open today’s note'}
                        </span>
                        <span className={notaKbdHintClass}>
                          {formatShortcut({ key: 'D' })}
                        </span>
                      </Command.Item>
                    ) : null}
                    <Command.Item
                      value="open-note-graph"
                      keywords={[
                        'graph',
                        'map',
                        'visual',
                        'links',
                        'connections',
                        'network',
                      ]}
                      onSelect={() => {
                        navigateFromLegacyPath('/notes/graph');
                        closePalette();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      <PaletteItemIcon
                        name="brain-circuit"
                        className="text-muted-foreground group-aria-selected:text-accent-foreground"
                      />
                      <span className="min-w-0 flex-1">Open note graph</span>
                    </Command.Item>
                    <Command.Item
                      value="view-writing-activity"
                      keywords={[
                        'activity',
                        'streak',
                        'graph',
                        'writing',
                        'heatmap',
                        'contribution',
                      ]}
                      onSelect={() => {
                        navigateToScreen({
                          kind: 'notes',
                          panel: 'list',
                          noteId: null,
                        });
                        closePalette();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      <PaletteItemIcon
                        name="history-circle"
                        className="text-muted-foreground group-aria-selected:text-accent-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        View writing activity
                      </span>
                    </Command.Item>
                    {showJournalCommand ? (
                      <Command.Item
                        value="open-journal"
                        keywords={[
                          'journal',
                          'calendar',
                          'diary',
                          'dates',
                          'timeline',
                          'day',
                        ]}
                        onSelect={() => {
                          navigateFromLegacyPath('/notes/journal');
                          closePalette();
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        )}
                      >
                        <PaletteItemIcon
                          name="clock"
                          className="text-muted-foreground group-aria-selected:text-accent-foreground"
                        />
                        <span className="min-w-0 flex-1">
                          {t('Open journal')}
                        </span>
                      </Command.Item>
                    ) : null}
                    <Command.Item
                      value="study-notes-from-recording"
                      disabled={busy || startingAudioNote}
                      keywords={[
                        'record',
                        'audio',
                        'lecture',
                        'class',
                        'transcript',
                        'capture',
                        'study',
                        'assistive',
                        'microphone',
                      ]}
                      onSelect={() => {
                        setStartingAudioNote(true);
                        void (async () => {
                          try {
                            await startStudyNotesFromRecording({
                              userId: user?.id ?? '',
                              notaProEntitled,
                              insertNoteAtFront,
                              refreshNotesList,
                            });
                            closePalette();
                          } finally {
                            setStartingAudioNote(false);
                          }
                        })();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <PaletteItemIcon
                        name="volume-2"
                        className="text-muted-foreground group-aria-selected:text-accent-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        {startingAudioNote
                          ? 'Starting capture…'
                          : 'Generate study notes from recording'}
                      </span>
                    </Command.Item>
                    {activeNoteId ? (
                      <Command.Item
                        value="study-notes-append-to-open-note"
                        disabled={busy || startingAudioNote}
                        keywords={[
                          'record',
                          'audio',
                          'lecture',
                          'append',
                          'add',
                          'existing',
                          'current',
                          'merge',
                          'study',
                          'assistive',
                          'microphone',
                        ]}
                        onSelect={() => {
                          setStartingAudioNote(true);
                          (() => {
                            try {
                              startStudyNotesAppendToOpenNote({
                                userId: user?.id ?? '',
                                notaProEntitled,
                                openNoteId: activeNoteId,
                              });
                              closePalette();
                            } finally {
                              setStartingAudioNote(false);
                            }
                          })();
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                          'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                        )}
                      >
                        <PaletteItemIcon
                          name="volume-2"
                          className="text-muted-foreground group-aria-selected:text-accent-foreground"
                        />
                        <span className="min-w-0 flex-1">
                          {startingAudioNote
                            ? 'Starting capture…'
                            : 'Add study notes from recording to this note'}
                        </span>
                      </Command.Item>
                    ) : null}
                  </Command.Group>
                ) : (
                  <Command.Group
                    heading="Subscription"
                    className={groupHeadingClassName}
                  >
                    <Command.Item
                      value="open-settings-subscribe"
                      keywords={['upgrade', 'pay', 'billing', 'plan']}
                      onSelect={() => {
                        navigateFromLegacyPath('/notes/settings');
                        closePalette();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      <PaletteItemIcon
                        name="sparkles"
                        className="text-muted-foreground group-aria-selected:text-accent-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        Open Settings to subscribe
                      </span>
                    </Command.Item>
                  </Command.Group>
                )}
                {notaProEntitled && notes.length > 0 ? (
                  <Command.Group
                    heading={
                      <span className="flex w-full items-center gap-2 pr-1 font-normal">
                        <span className="min-w-0 flex-1">
                          {semanticSearchLoading
                            ? 'Semantic search…'
                            : 'Open note'}
                        </span>
                        <span className={notaKbdHintClass}>Space</span>
                      </span>
                    }
                    className={groupHeadingClassName}
                  >
                    {notesForOpenPalette.map((note) => (
                      <Command.Item
                        key={note.id}
                        value={`note-open:${note.id}`}
                        keywords={[
                          'go',
                          'open',
                          'switch',
                          note.title,
                          note.id,
                          note.id.slice(0, 8),
                        ]}
                        onSelect={() => {
                          navigateFromLegacyPath(`/notes/${note.id}`);
                          closePalette();
                        }}
                        className={cn(
                          commandItemRowClass,
                          'group text-foreground',
                          'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        )}
                      >
                        <PaletteItemIcon
                          name="file-description"
                          className="text-muted-foreground group-aria-selected:text-accent-foreground"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {note.title || 'Untitled Note'}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}
                {notaProEntitled && activeNoteId ? (
                  <Command.Group
                    heading="This note"
                    className={groupHeadingClassName}
                  >
                    <Command.Item
                      value="insert-mermaid-diagram"
                      disabled={!canInsertMermaid}
                      keywords={[
                        'mermaid',
                        'diagram',
                        'flowchart',
                        'chart',
                        'graph',
                        'insert',
                      ]}
                      onSelect={() => {
                        if (!canInsertMermaid) return;
                        insertMermaidAtCursor();
                        closePalette();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <PaletteItemIcon
                        name="brain-circuit"
                        className="text-muted-foreground group-aria-selected:text-accent-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        Insert Mermaid diagram
                      </span>
                    </Command.Item>
                    <Command.Item
                      value="insert-table"
                      disabled={!canInsertTable}
                      keywords={['table', 'grid', 'rows', 'columns', 'insert']}
                      onSelect={() => {
                        if (!canInsertTable) return;
                        insertTableAtCursor();
                        closePalette();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <PaletteItemIcon
                        name="chart-bar"
                        className="text-muted-foreground group-aria-selected:text-accent-foreground"
                      />
                      <span className="min-w-0 flex-1">Insert table</span>
                    </Command.Item>
                    <Command.Item
                      value="insert-task-list"
                      disabled={!canInsertTaskList}
                      keywords={[
                        'task',
                        'todo',
                        'checklist',
                        'checkbox',
                        'list',
                        'insert',
                      ]}
                      onSelect={() => {
                        if (!canInsertTaskList) return;
                        insertTaskListAtCursor();
                        closePalette();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <PaletteItemIcon
                        name="history-circle"
                        className="text-muted-foreground group-aria-selected:text-accent-foreground"
                      />
                      <span className="min-w-0 flex-1">Insert task list</span>
                    </Command.Item>
                    <Command.Item
                      value="delete-this-note"
                      disabled={busy}
                      keywords={['remove', 'trash', 'delete note']}
                      onSelect={() => {
                        if (
                          !window.confirm(
                            'Are you sure you want to delete this note?',
                          )
                        ) {
                          return;
                        }
                        setBusyAction('delete');
                        void (async () => {
                          try {
                            const delNote = notes.find(
                              (x) => x.id === activeNoteId,
                            );
                            await clientDeleteNoteById(activeNoteId, {
                              userId: user?.id ?? '',
                              removeNoteFromList,
                              removeFolderFromList,
                              refreshNotesList,
                              notaProEntitled,
                              noteFolderId: delNote?.folder_id ?? null,
                              userPreferences,
                            });
                            closePalette();
                          } finally {
                            setBusyAction(null);
                          }
                        })();
                      }}
                      className={cn(
                        commandItemRowClass,
                        'group text-destructive',
                        'aria-selected:bg-destructive/15 aria-selected:text-destructive',
                        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      )}
                    >
                      <PaletteItemIcon
                        name="trash"
                        className="text-destructive group-aria-selected:text-destructive"
                      />
                      <span className="min-w-0 flex-1">
                        {busy && busyAction === 'delete'
                          ? 'Deleting...'
                          : 'Delete this note'}
                      </span>
                    </Command.Item>
                  </Command.Group>
                ) : null}
                <Command.Group
                  heading="Appearance"
                  className={groupHeadingClassName}
                >
                  {appearanceCommands.map((command) => (
                    <PaletteActionItem key={command.value} command={command} />
                  ))}
                  {zoomCommands.map((command) => (
                    <PaletteActionItem key={command.value} command={command} />
                  ))}
                </Command.Group>
                <Command.Group
                  heading="Account"
                  className={groupHeadingClassName}
                >
                  <Command.Item
                    value="view-release-notes"
                    keywords={[
                      'changelog',
                      'release notes',
                      'whats new',
                      'updates',
                    ]}
                    onSelect={() => {
                      closePalette();
                      setReleaseNotesOpen(true);
                    }}
                    className={cn(
                      commandItemRowClass,
                      'group text-foreground',
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    )}
                  >
                    <PaletteItemIcon
                      name="sparkles"
                      className="text-muted-foreground group-aria-selected:text-accent-foreground"
                    />
                    <span className="min-w-0 flex-1">What&apos;s new</span>
                  </Command.Item>
                  <Command.Item
                    value="sign-out"
                    disabled={busy}
                    keywords={['logout', 'log out', 'exit']}
                    onSelect={() => {
                      setBusyAction('logout');
                      void (async () => {
                        try {
                          await signOut();
                          navigateToScreen({ kind: 'landing' });
                          closePalette();
                        } finally {
                          setBusyAction(null);
                        }
                      })();
                    }}
                    className={cn(
                      commandItemRowClass,
                      'group text-destructive',
                      'aria-selected:bg-destructive/15 aria-selected:text-destructive',
                      'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                    )}
                  >
                    <PaletteItemIcon
                      name="logout"
                      className="text-destructive group-aria-selected:text-destructive"
                    />
                    <span className="min-w-0 flex-1">
                      {busy && busyAction === 'logout'
                        ? 'Signing out...'
                        : 'Sign out'}
                    </span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/40 px-3 py-2 text-muted-foreground text-xs"
                aria-hidden
              >
                <span>
                  Back{' '}
                  <span className={notaKbdFooterClass}>
                    {formatShortcut({ key: '[' })}
                  </span>
                </span>
                <span>
                  Forward{' '}
                  <span className={notaKbdFooterClass}>
                    {formatShortcut({ key: ']' })}
                  </span>
                </span>
              </div>
            </Command>
            <Dialog.Close
              type="button"
              className="sr-only"
              aria-label="Close command palette"
            >
              Close
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <FolderCreateDialog
        open={folderCreateDlgOpen}
        onOpenChange={setFolderCreateDlgOpen}
        userId={user?.id}
        insertFolderSorted={insertFolderSorted}
        refreshNotesList={refreshNotesList}
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
      <ReleaseNotesDialog
        open={releaseNotesOpen}
        onOpenChange={setReleaseNotesOpen}
      />
    </>
  );
}
