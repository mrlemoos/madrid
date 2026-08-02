import { describe, expect, it } from 'vitest';
import { MOVE_PICK_VALUE_PREFIX } from './move-pick-helpers';
import { movePickEnterAction } from './move-pick-enter';

describe('movePickEnterAction', () => {
  it('delegates when not on pick-note step', () => {
    // Arrange
    const base = {
      moveMultiSelectActive: true,
      searchTrimmed: '',
      highlightedValue: `${MOVE_PICK_VALUE_PREFIX}n1`,
      selectedCount: 1,
    };

    // Act
    const idle = movePickEnterAction({ ...base, moveFlow: 'idle' });
    const folder = movePickEnterAction({ ...base, moveFlow: 'pickFolder' });

    // Assert
    expect(idle).toEqual({ kind: 'cmdkDefault' });
    expect(folder).toEqual({ kind: 'cmdkDefault' });
  });

  it('delegates when multi-select is not active (single-note Enter)', () => {
    // Arrange
    const params = {
      moveFlow: 'pickNote' as const,
      moveMultiSelectActive: false,
      searchTrimmed: '',
      highlightedValue: `${MOVE_PICK_VALUE_PREFIX}n1`,
      selectedCount: 0,
    };

    // Act
    const out = movePickEnterAction(params);

    // Assert
    expect(out).toEqual({ kind: 'cmdkDefault' });
  });

  it('delegates when search is non-empty', () => {
    // Arrange
    const params = {
      moveFlow: 'pickNote' as const,
      moveMultiSelectActive: true,
      searchTrimmed: 'hello',
      highlightedValue: `${MOVE_PICK_VALUE_PREFIX}n1`,
      selectedCount: 2,
    };

    // Act
    const out = movePickEnterAction(params);

    // Assert
    expect(out).toEqual({ kind: 'cmdkDefault' });
  });

  it('delegates for move-pick-continue and move-cancel', () => {
    // Arrange
    const base = {
      moveFlow: 'pickNote' as const,
      moveMultiSelectActive: true,
      searchTrimmed: '',
      selectedCount: 2,
    };

    // Act
    const continueRow = movePickEnterAction({
      ...base,
      highlightedValue: 'move-pick-continue',
    });
    const cancelRow = movePickEnterAction({
      ...base,
      highlightedValue: 'move-cancel',
    });

    // Assert
    expect(continueRow).toEqual({ kind: 'cmdkDefault' });
    expect(cancelRow).toEqual({ kind: 'cmdkDefault' });
  });

  it('delegates when highlighted value is not a move-pick note row', () => {
    // Arrange
    const params = {
      moveFlow: 'pickNote' as const,
      moveMultiSelectActive: true,
      searchTrimmed: '',
      highlightedValue: 'create-note',
      selectedCount: 1,
    };

    // Act
    const out = movePickEnterAction(params);

    // Assert
    expect(out).toEqual({ kind: 'cmdkDefault' });
  });

  it('advances when a note row is highlighted and at least one note is selected', () => {
    // Arrange
    const params = {
      moveFlow: 'pickNote' as const,
      moveMultiSelectActive: true,
      searchTrimmed: '',
      highlightedValue: `${MOVE_PICK_VALUE_PREFIX}abc`,
      selectedCount: 2,
    };

    // Act
    const out = movePickEnterAction(params);

    // Assert
    expect(out).toEqual({ kind: 'advanceToFolder' });
  });

  it('noops when a note row is highlighted but nothing is selected', () => {
    // Arrange
    const params = {
      moveFlow: 'pickNote' as const,
      moveMultiSelectActive: true,
      searchTrimmed: '',
      highlightedValue: `${MOVE_PICK_VALUE_PREFIX}abc`,
      selectedCount: 0,
    };

    // Act
    const out = movePickEnterAction(params);

    // Assert
    expect(out).toEqual({ kind: 'noop' });
  });
});
