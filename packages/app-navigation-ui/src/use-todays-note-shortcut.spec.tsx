import { cleanup, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';

const openTodaysNoteClient = vi.fn().mockResolvedValue(undefined);
const navigateFromLegacyPath = vi.fn();
const refreshNotesList = vi.fn();
const actions = { current: { refreshNotesList } as unknown };

vi.mock('./open-todays-note', () => ({ openTodaysNoteClient }));
vi.mock('@getmadrid/app-navigation-core/navigation', () => ({
  navigateFromLegacyPath,
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useOptionalNotesDataActions: () => actions.current,
}));

const { useTodaysNoteShortcut } = await import('./use-todays-note-shortcut');

const NOTES = [] as Pick<Note, 'id' | 'folder_id'>[];

function mount(userId: string | undefined, enabled = true, entitled = true) {
  function Harness(): null {
    useTodaysNoteShortcut(NOTES, userId, enabled, entitled);
    return null;
  }
  return render(<Harness />);
}

function press(init: KeyboardEventInit & { key: string }) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  document.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  actions.current = { refreshNotesList };
});

describe('useTodaysNoteShortcut', () => {
  it('opens today’s note on Mod+D and takes the key from the browser', () => {
    // Arrange
    mount('user-1');

    // Act
    const event = press({ key: 'd', metaKey: true });

    // Assert
    expect(event.defaultPrevented).toBe(true);
    expect(openTodaysNoteClient).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: NOTES,
        userId: 'user-1',
        navigate: navigateFromLegacyPath,
        notaProEntitled: true,
      }),
    );
  });

  it('accepts the capitalised key, as Caps Lock produces', () => {
    // Arrange
    mount('user-1');

    // Act
    press({ key: 'D', ctrlKey: true });

    // Assert
    expect(openTodaysNoteClient).toHaveBeenCalledTimes(1);
  });

  it('refreshes the vault list quietly after opening', () => {
    // Arrange
    mount('user-1');
    press({ key: 'd', metaKey: true });

    // Act
    const { revalidate } = openTodaysNoteClient.mock.calls[0]?.[0] as {
      revalidate: () => void;
    };
    revalidate();

    // Assert — a visible loading flip would blank the sidebar
    expect(refreshNotesList).toHaveBeenCalledWith({ silent: true });
  });

  it('ignores Shift and Alt variants, which mean something else', () => {
    // Arrange
    mount('user-1');

    // Act
    press({ key: 'd', metaKey: true, shiftKey: true });
    press({ key: 'd', metaKey: true, altKey: true });
    press({ key: 'd' });

    // Assert
    expect(openTodaysNoteClient).not.toHaveBeenCalled();
  });

  it('leaves the command palette to its own key handling', () => {
    // Arrange
    mount('user-1');
    const palette = document.createElement('div');
    palette.setAttribute('data-nota-command-palette', '');
    const input = document.createElement('input');
    palette.append(input);
    document.body.append(palette);

    // Act
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    // Assert
    expect(openTodaysNoteClient).not.toHaveBeenCalled();
    palette.remove();
  });

  it('survives a missing notes-data provider', () => {
    // Arrange
    actions.current = undefined;
    mount('user-1');
    press({ key: 'd', metaKey: true });

    // Act
    const { revalidate } = openTodaysNoteClient.mock.calls[0]?.[0] as {
      revalidate: () => void;
    };

    // Assert
    expect(() => {
      revalidate();
    }).not.toThrow();
  });

  it('does nothing while signed out', () => {
    // Arrange
    const { unmount } = mount(undefined);

    // Act
    press({ key: 'd', metaKey: true });
    unmount();

    // Assert
    expect(openTodaysNoteClient).not.toHaveBeenCalled();
  });

  it('does nothing while disabled', () => {
    // Arrange
    const { unmount } = mount('user-1', false);

    // Act
    press({ key: 'd', metaKey: true });
    unmount();

    // Assert
    expect(openTodaysNoteClient).not.toHaveBeenCalled();
  });

  it('detaches its listener on unmount', () => {
    // Arrange
    const { unmount } = mount('user-1');

    // Act
    unmount();
    press({ key: 'd', metaKey: true });

    // Assert
    expect(openTodaysNoteClient).not.toHaveBeenCalled();
  });
});
