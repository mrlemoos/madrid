import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  NOTA_RENAME_FOLDER_REQUEST_EVENT,
  dispatchRenameFolderRequest,
} from './folder-rename-request';

describe('folder-rename-request', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches a CustomEvent with the folder id', () => {
    // Arrange
    const handler = vi.fn();
    window.addEventListener(NOTA_RENAME_FOLDER_REQUEST_EVENT, handler);

    // Act
    dispatchRenameFolderRequest('folder-42');

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as CustomEvent<{
      folderId: string;
    }>;
    expect(event.type).toBe(NOTA_RENAME_FOLDER_REQUEST_EVENT);
    expect(event.detail).toEqual({ folderId: 'folder-42' });

    window.removeEventListener(NOTA_RENAME_FOLDER_REQUEST_EVENT, handler);
  });
});
