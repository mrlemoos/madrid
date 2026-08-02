import { describe, expect, it } from 'vitest';
import {
  initialPaletteMode,
  moveCommandGroupHeading,
  moveTargetNoteIds,
  paletteModeReducer,
  type PaletteMode,
} from './palette-mode.js';

describe('paletteModeReducer', () => {
  it('starts idle', () => {
    // Arrange / Act
    const mode = initialPaletteMode;

    // Assert
    expect(mode).toEqual({ kind: 'idle' });
  });

  it('starts a move by picking a note with multi-select off', () => {
    // Arrange
    const state: PaletteMode = { kind: 'idle' };

    // Act
    const next = paletteModeReducer(state, { type: 'startMovePickNote' });

    // Assert
    expect(next).toEqual({
      kind: 'movePickNote',
      multiSelect: false,
      selected: new Set(),
    });
  });

  it('toggling a note activates multi-select and adds the id', () => {
    // Arrange
    const state: PaletteMode = {
      kind: 'movePickNote',
      multiSelect: false,
      selected: new Set(),
    };

    // Act
    const next = paletteModeReducer(state, {
      type: 'moveToggleSelect',
      noteId: 'n1',
    });

    // Assert
    expect(next).toEqual({
      kind: 'movePickNote',
      multiSelect: true,
      selected: new Set(['n1']),
    });
  });

  it('toggling the same note twice removes it but keeps multi-select active', () => {
    // Arrange
    const start: PaletteMode = {
      kind: 'movePickNote',
      multiSelect: false,
      selected: new Set(),
    };

    // Act
    const once = paletteModeReducer(start, {
      type: 'moveToggleSelect',
      noteId: 'n1',
    });
    const twice = paletteModeReducer(once, {
      type: 'moveToggleSelect',
      noteId: 'n1',
    });

    // Assert
    expect(twice).toEqual({
      kind: 'movePickNote',
      multiSelect: true,
      selected: new Set(),
    });
  });

  it('ignores a toggle when not picking notes', () => {
    // Arrange
    const state: PaletteMode = { kind: 'idle' };

    // Act
    const next = paletteModeReducer(state, {
      type: 'moveToggleSelect',
      noteId: 'n1',
    });

    // Assert
    expect(next).toBe(state);
  });

  it('advances to the destination folder pick with a copied target set', () => {
    // Arrange
    const state: PaletteMode = {
      kind: 'movePickNote',
      multiSelect: true,
      selected: new Set(['a', 'b']),
    };
    const targets = ['a', 'b'];

    // Act
    const next = paletteModeReducer(state, {
      type: 'moveAdvanceToFolder',
      targetNoteIds: targets,
    });

    // Assert
    expect(next).toEqual({ kind: 'movePickFolder', targetNoteIds: ['a', 'b'] });
    // copied, not aliased
    expect(
      (next as { targetNoteIds: readonly string[] }).targetNoteIds,
    ).not.toBe(targets);
  });

  it('enters each folder-picker mode from a start action', () => {
    // Arrange
    const idle: PaletteMode = { kind: 'idle' };

    // Act / Assert
    expect(paletteModeReducer(idle, { type: 'startDeleteFolderPick' })).toEqual(
      {
        kind: 'deleteFolderPick',
      },
    );
    expect(paletteModeReducer(idle, { type: 'startRenameFolderPick' })).toEqual(
      {
        kind: 'renameFolderPick',
      },
    );
    expect(paletteModeReducer(idle, { type: 'startTintFolderPick' })).toEqual({
      kind: 'tintFolderPick',
    });
  });

  it('picks a folder to tint and advances to colour pick', () => {
    // Arrange
    const state: PaletteMode = { kind: 'tintFolderPick' };

    // Act
    const next = paletteModeReducer(state, {
      type: 'tintChooseFolder',
      folderId: 'f1',
    });

    // Assert
    expect(next).toEqual({ kind: 'tintColourPick', folderId: 'f1' });
  });

  it('reset returns to idle from any mode', () => {
    // Arrange
    const state: PaletteMode = { kind: 'tintColourPick', folderId: 'f1' };

    // Act
    const next = paletteModeReducer(state, { type: 'reset' });

    // Assert
    expect(next).toEqual({ kind: 'idle' });
  });
});

describe('moveTargetNoteIds', () => {
  it('returns the queued ids only while picking a destination folder', () => {
    // Arrange
    const picking: PaletteMode = {
      kind: 'movePickFolder',
      targetNoteIds: ['a'],
    };
    const idle: PaletteMode = { kind: 'idle' };

    // Act / Assert
    expect(moveTargetNoteIds(picking)).toEqual(['a']);
    expect(moveTargetNoteIds(idle)).toEqual([]);
  });
});

describe('moveCommandGroupHeading', () => {
  it('labels the pick-note step by multi-select state', () => {
    // Arrange / Act / Assert
    expect(
      moveCommandGroupHeading(
        { kind: 'movePickNote', multiSelect: false, selected: new Set() },
        false,
      ),
    ).toBe('Move note: pick note');
    expect(
      moveCommandGroupHeading(
        { kind: 'movePickNote', multiSelect: true, selected: new Set() },
        false,
      ),
    ).toBe('Move notes: pick notes');
  });

  it('labels the destination step by count and in-flight state', () => {
    // Arrange
    const single: PaletteMode = {
      kind: 'movePickFolder',
      targetNoteIds: ['a'],
    };
    const many: PaletteMode = {
      kind: 'movePickFolder',
      targetNoteIds: ['a', 'b'],
    };

    // Act / Assert
    expect(moveCommandGroupHeading(single, false)).toBe(
      'Move note: destination',
    );
    expect(moveCommandGroupHeading(many, false)).toBe(
      'Move 2 notes: destination',
    );
    expect(moveCommandGroupHeading(single, true)).toBe('Moving notes…');
  });
});
