import { parseMovePickNoteId } from './move-pick-helpers';

export type MovePickEnterAction =
  | { kind: 'cmdkDefault' }
  | { kind: 'advanceToFolder' }
  | { kind: 'noop' };

/**
 * When move pick-note multi-select is active, decides how Enter should behave
 * before cmdk runs the highlighted item's `onSelect`.
 */
export function movePickEnterAction(params: {
  moveFlow: 'idle' | 'pickNote' | 'pickFolder';
  moveMultiSelectActive: boolean;
  searchTrimmed: string;
  highlightedValue: string;
  selectedCount: number;
}): MovePickEnterAction {
  const {
    moveFlow,
    moveMultiSelectActive,
    searchTrimmed,
    highlightedValue,
    selectedCount,
  } = params;

  if (moveFlow !== 'pickNote' || !moveMultiSelectActive) {
    return { kind: 'cmdkDefault' };
  }
  if (searchTrimmed !== '') {
    return { kind: 'cmdkDefault' };
  }
  if (
    highlightedValue === 'move-cancel' ||
    highlightedValue === 'move-pick-continue'
  ) {
    return { kind: 'cmdkDefault' };
  }
  const noteId = parseMovePickNoteId(highlightedValue);
  if (noteId == null) {
    return { kind: 'cmdkDefault' };
  }
  if (selectedCount > 0) {
    return { kind: 'advanceToFolder' };
  }
  return { kind: 'noop' };
}
