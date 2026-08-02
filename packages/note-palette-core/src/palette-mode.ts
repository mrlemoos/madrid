import { toggleIdInSet } from './move-pick-helpers.js';

/**
 * The command palette's mutually-exclusive interaction mode. Replaces the eight
 * parallel `useState` flags (moveFlow, moveTargetNoteIds, moveMultiSelectActive,
 * moveSelectedNoteIds, deleteFolderPickerOpen, renameFolderPickerOpen,
 * tintFolderFlow, tintFolderId) that could otherwise drift into impossible
 * combinations. A palette is in exactly one of these at a time.
 */
export type PaletteMode =
  | { kind: 'idle' }
  | {
      kind: 'movePickNote';
      multiSelect: boolean;
      selected: ReadonlySet<string>;
    }
  | { kind: 'movePickFolder'; targetNoteIds: readonly string[] }
  | { kind: 'deleteFolderPick' }
  | { kind: 'renameFolderPick' }
  | { kind: 'tintFolderPick' }
  | { kind: 'tintColourPick'; folderId: string };

export type PaletteModeAction =
  /** Palette closed / any flow cancelled → back to the neutral list. */
  | { type: 'reset' }
  /** Start moving notes: pick the note(s) to move. */
  | { type: 'startMovePickNote' }
  /** Toggle a note in the multi-select set (activates multi-select). */
  | { type: 'moveToggleSelect'; noteId: string }
  /** Advance from note-pick to destination-folder pick with a fixed target set. */
  | { type: 'moveAdvanceToFolder'; targetNoteIds: readonly string[] }
  | { type: 'startDeleteFolderPick' }
  | { type: 'startRenameFolderPick' }
  | { type: 'startTintFolderPick' }
  /** From tint folder-pick, choose a folder and advance to colour pick. */
  | { type: 'tintChooseFolder'; folderId: string };

export const initialPaletteMode: PaletteMode = { kind: 'idle' };

/**
 * Pure transition for the palette's exclusive mode. Any unhandled action for the
 * current mode is a no-op (returns the same state), matching the guards the
 * component applied inline (e.g. Cmd+M only starts a move from idle).
 */
export function paletteModeReducer(
  state: PaletteMode,
  action: PaletteModeAction,
): PaletteMode {
  switch (action.type) {
    case 'reset':
      return { kind: 'idle' };
    case 'startMovePickNote':
      return { kind: 'movePickNote', multiSelect: false, selected: new Set() };
    case 'moveToggleSelect':
      if (state.kind !== 'movePickNote') {
        return state;
      }
      return {
        kind: 'movePickNote',
        multiSelect: true,
        selected: toggleIdInSet(state.selected, action.noteId),
      };
    case 'moveAdvanceToFolder':
      return {
        kind: 'movePickFolder',
        targetNoteIds: [...action.targetNoteIds],
      };
    case 'startDeleteFolderPick':
      return { kind: 'deleteFolderPick' };
    case 'startRenameFolderPick':
      return { kind: 'renameFolderPick' };
    case 'startTintFolderPick':
      return { kind: 'tintFolderPick' };
    case 'tintChooseFolder':
      return { kind: 'tintColourPick', folderId: action.folderId };
    default:
      action satisfies never;
      return state;
  }
}

/** Selector: notes queued for the current move destination pick (empty otherwise). */
export function moveTargetNoteIds(mode: PaletteMode): readonly string[] {
  return mode.kind === 'movePickFolder' ? mode.targetNoteIds : [];
}

/** Selector: the heading shown above the move flow's group. */
export function moveCommandGroupHeading(
  mode: PaletteMode,
  movingInFlight: boolean,
): string {
  if (mode.kind === 'movePickFolder') {
    if (movingInFlight) {
      return 'Moving notes…';
    }
    return mode.targetNoteIds.length > 1
      ? `Move ${String(mode.targetNoteIds.length)} notes: destination`
      : 'Move note: destination';
  }
  if (mode.kind === 'movePickNote') {
    return mode.multiSelect ? 'Move notes: pick notes' : 'Move note: pick note';
  }
  return 'Move note: destination';
}
