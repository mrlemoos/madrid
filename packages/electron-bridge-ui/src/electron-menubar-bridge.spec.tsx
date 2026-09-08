import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clientCreateNote = vi.fn().mockResolvedValue(undefined);
const startStudyNotesFromRecording = vi.fn().mockResolvedValue(undefined);
const createNoteFromMenubarClipboard = vi.fn().mockResolvedValue(undefined);
const dispatchMenubarNewFolderRequest = vi.fn();
const dispatchMenubarMoveNoteRequest = vi.fn();
const zoomIn = vi.fn();
const zoomOut = vi.fn();
const resetZoom = vi.fn();
const notesData = {
  current: {
    notes: [],
    notaProEntitled: true,
    refreshNotesList: vi.fn(),
    insertNoteAtFront: vi.fn(),
    patchNoteInList: vi.fn(),
  },
};

vi.mock('@getmadrid/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesData: () => notesData.current,
}));
vi.mock('@getmadrid/note-folders-ui/create-note-client', () => ({
  clientCreateNote,
}));
vi.mock('@getmadrid/note-capture-ui/audio-to-note-start', () => ({
  startStudyNotesFromRecording,
}));
vi.mock('@getmadrid/electron-bridge-core/menubar-events', () => ({
  dispatchMenubarNewFolderRequest,
  dispatchMenubarMoveNoteRequest,
}));
vi.mock('@getmadrid/note-runtime/stores/zoom', () => ({
  useNotaZoomStore: { getState: () => ({ zoomIn, zoomOut, resetZoom }) },
}));
vi.mock('./electron-clipboard-note', () => ({
  createNoteFromMenubarClipboard,
}));

const { ElectronMenubarBridge } = await import('./electron-menubar-bridge');

/** Mounts the bridge and hands back the menu callback the shell registered. */
function mountBridge() {
  let handler: ((payload: unknown) => void) | null = null;
  const unsubscribe = vi.fn();
  (window as { nota?: unknown }).nota = {
    subscribeMenubarActions: (fn: (payload: unknown) => void) => {
      handler = fn;
      return unsubscribe;
    },
  };
  const view = render(<ElectronMenubarBridge />);
  return {
    ...view,
    unsubscribe,
    send: (payload: unknown) => handler?.(payload),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  notesData.current = {
    notes: [],
    notaProEntitled: true,
    refreshNotesList: vi.fn(),
    insertNoteAtFront: vi.fn(),
    patchNoteInList: vi.fn(),
  };
});

afterEach(() => {
  delete (window as { nota?: unknown }).nota;
});

describe('ElectronMenubarBridge', () => {
  it('renders nothing and stays quiet in the browser', () => {
    // Arrange|Act
    const { container } = render(<ElectronMenubarBridge />);

    // Assert
    expect(container.firstElementChild).toBeNull();
  });

  it('creates a note from the New Note menu item', async () => {
    // Arrange
    const bridge = mountBridge();

    // Act
    bridge.send({ kind: 'create-note' });
    await vi.waitFor(() => {
      expect(clientCreateNote).toHaveBeenCalled();
    });

    // Assert
    expect(clientCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', notaProEntitled: true }),
    );
  });

  it('asks the SPA to open its folder and move dialogs', () => {
    // Arrange
    const bridge = mountBridge();

    // Act
    bridge.send({ kind: 'create-folder' });
    bridge.send({ kind: 'move-note' });

    // Assert
    expect(dispatchMenubarNewFolderRequest).toHaveBeenCalledTimes(1);
    expect(dispatchMenubarMoveNoteRequest).toHaveBeenCalledTimes(1);
  });

  it('keeps folder and move actions behind the entitlement', () => {
    // Arrange
    notesData.current = { ...notesData.current, notaProEntitled: false };
    const bridge = mountBridge();

    // Act
    bridge.send({ kind: 'create-folder' });
    bridge.send({ kind: 'move-note' });

    // Assert
    expect(dispatchMenubarNewFolderRequest).not.toHaveBeenCalled();
    expect(dispatchMenubarMoveNoteRequest).not.toHaveBeenCalled();
  });

  it('drives the app’s own zoom from the View menu', () => {
    // Arrange
    const bridge = mountBridge();

    // Act
    bridge.send({ kind: 'zoom-in' });
    bridge.send({ kind: 'zoom-out' });
    bridge.send({ kind: 'zoom-reset' });

    // Assert
    expect(zoomIn).toHaveBeenCalledTimes(1);
    expect(zoomOut).toHaveBeenCalledTimes(1);
    expect(resetZoom).toHaveBeenCalledTimes(1);
  });

  it('starts assistive capture from the menu', async () => {
    // Arrange
    const bridge = mountBridge();

    // Act
    bridge.send({ kind: 'study-recording' });

    // Assert
    await vi.waitFor(() => {
      expect(startStudyNotesFromRecording).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });

  it('creates a note from clipboard text, surfacing failures to the reader', async () => {
    // Arrange
    const bridge = mountBridge();
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    // Act
    bridge.send({
      kind: 'clipboard-note',
      clipboard: { kind: 'text', text: 'hi' },
    });
    await vi.waitFor(() => {
      expect(createNoteFromMenubarClipboard).toHaveBeenCalled();
    });
    const { onError } = createNoteFromMenubarClipboard.mock.calls[0]?.[0] as {
      onError: (message: string) => void;
    };
    onError('Clipboard was empty');

    // Assert
    expect(createNoteFromMenubarClipboard).toHaveBeenCalledWith(
      expect.objectContaining({
        clipboard: { kind: 'text', text: 'hi' },
        userId: 'user-1',
      }),
    );
    expect(alert).toHaveBeenCalledWith('Clipboard was empty');
    alert.mockRestore();
  });

  it('ignores a payload it does not recognise', async () => {
    // Arrange
    const bridge = mountBridge();

    // Act
    bridge.send({ kind: 'launch-missiles' });
    bridge.send(null);
    bridge.send({ kind: 'clipboard-note', clipboard: { kind: 'text' } });
    await Promise.resolve();

    // Assert
    expect(clientCreateNote).not.toHaveBeenCalled();
    expect(createNoteFromMenubarClipboard).not.toHaveBeenCalled();
  });

  it('reads the latest vault state, not the one captured at mount', async () => {
    // Arrange
    const bridge = mountBridge();
    const insertNoteAtFront = vi.fn();
    notesData.current = { ...notesData.current, insertNoteAtFront };
    bridge.rerender(<ElectronMenubarBridge />);

    // Act
    bridge.send({ kind: 'create-note' });

    // Assert — the subscription is set up once, so it must read through a ref
    await vi.waitFor(() => {
      expect(clientCreateNote).toHaveBeenCalledWith(
        expect.objectContaining({ insertNoteAtFront }),
      );
    });
  });

  it('unsubscribes from the menu on unmount', () => {
    // Arrange
    const bridge = mountBridge();

    // Act
    bridge.unmount();

    // Assert
    expect(bridge.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
