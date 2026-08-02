import { describe, expect, it } from 'vitest';
import {
  MOVE_PICK_VALUE_PREFIX,
  parseMovePickNoteId,
  readHighlightedCmdkItemValue,
  readMovePickNoteIdFromHighlightedItem,
  toggleIdInSet,
} from './move-pick-helpers';

describe('parseMovePickNoteId', () => {
  it('returns the note id for a valid move-pick value', () => {
    // Arrange
    const id = '550e8400-e29b-41d4-a716-446655440000';

    // Act
    const out = parseMovePickNoteId(`${MOVE_PICK_VALUE_PREFIX}${id}`);

    // Assert
    expect(out).toBe(id);
  });

  it('returns null for other command values', () => {
    // Act
    expect(parseMovePickNoteId('create-note')).toBeNull();
    expect(parseMovePickNoteId('move-pick:')).toBeNull();
    expect(parseMovePickNoteId('')).toBeNull();
  });
});

describe('readMovePickNoteIdFromHighlightedItem', () => {
  it('returns the move-pick id from the highlighted cmdk item', () => {
    // Arrange
    const root = document.createElement('div');
    const item = document.createElement('div');
    item.setAttribute('cmdk-item', '');
    item.setAttribute('data-value', `${MOVE_PICK_VALUE_PREFIX}note-1`);
    item.setAttribute('data-selected', 'true');
    root.appendChild(item);

    // Act
    const out = readMovePickNoteIdFromHighlightedItem(root);

    // Assert
    expect(out).toBe('note-1');
  });

  it('returns null when no highlighted item', () => {
    // Arrange
    const root = document.createElement('div');

    // Act
    const out = readMovePickNoteIdFromHighlightedItem(root);

    // Assert
    expect(out).toBeNull();
  });
});

describe('readHighlightedCmdkItemValue', () => {
  it('returns data-value for the highlighted item', () => {
    // Arrange
    const root = document.createElement('div');
    const item = document.createElement('div');
    item.setAttribute('cmdk-item', '');
    item.setAttribute('data-value', 'move-pick-continue');
    item.setAttribute('data-selected', 'true');
    root.appendChild(item);

    // Act
    const out = readHighlightedCmdkItemValue(root);

    // Assert
    expect(out).toBe('move-pick-continue');
  });

  it('returns null when no highlighted item', () => {
    // Arrange
    const root = document.createElement('div');

    // Act
    const out = readHighlightedCmdkItemValue(root);

    // Assert
    expect(out).toBeNull();
  });
});

describe('toggleIdInSet', () => {
  it('adds an id when absent', () => {
    // Arrange
    const prev = new Set<string>();

    // Act
    const next = toggleIdInSet(prev, 'a');

    // Assert
    expect(next.has('a')).toBe(true);
    expect(prev.has('a')).toBe(false);
  });

  it('removes an id when present', () => {
    // Arrange
    const prev = new Set(['a', 'b']);

    // Act
    const next = toggleIdInSet(prev, 'a');

    // Assert
    expect(next.has('a')).toBe(false);
    expect(next.has('b')).toBe(true);
  });
});
