import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT,
  NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT,
  dispatchMenubarMoveNoteRequest,
  dispatchMenubarNewFolderRequest,
} from './electron-menubar-events';

describe('electron-menubar-events', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches new-folder request event', () => {
    // Arrange
    const handler = vi.fn();
    window.addEventListener(NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT, handler);

    // Act
    dispatchMenubarNewFolderRequest();

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT, handler);
  });

  it('dispatches move-note request event', () => {
    // Arrange
    const handler = vi.fn();
    window.addEventListener(NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT, handler);

    // Act
    dispatchMenubarMoveNoteRequest();

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT, handler);
  });
});
