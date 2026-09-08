import { cleanup, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const zoomIn = vi.fn();
const zoomOut = vi.fn();
const resetZoom = vi.fn();

vi.mock('@getmadrid/note-runtime/stores/zoom', () => ({
  useNotaZoomStore: { getState: () => ({ zoomIn, zoomOut, resetZoom }) },
}));

const { useNotaZoomShortcut } = await import('./use-nota-zoom-shortcut');

function mount(userId: string | undefined, enabled = true) {
  function Harness(): null {
    useNotaZoomShortcut(userId, enabled);
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
});

describe('useNotaZoomShortcut', () => {
  it('zooms in on both the shifted and unshifted plus key', () => {
    // Arrange
    mount('user-1');

    // Act
    press({ key: '=', metaKey: true });
    press({ key: '+', metaKey: true });

    // Assert
    expect(zoomIn).toHaveBeenCalledTimes(2);
  });

  it('zooms out on minus and underscore', () => {
    // Arrange
    mount('user-1');

    // Act
    press({ key: '-', ctrlKey: true });
    press({ key: '_', ctrlKey: true });

    // Assert
    expect(zoomOut).toHaveBeenCalledTimes(2);
  });

  it('resets zoom on Mod+0', () => {
    // Arrange
    mount('user-1');

    // Act
    press({ key: '0', metaKey: true });

    // Assert
    expect(resetZoom).toHaveBeenCalledTimes(1);
  });

  it('takes the key from the browser so the page itself does not zoom', () => {
    // Arrange
    mount('user-1');

    // Act
    const event = press({ key: '=', metaKey: true });

    // Assert
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores the bare key and any Alt combination', () => {
    // Arrange
    mount('user-1');

    // Act
    press({ key: '=' });
    press({ key: '=', metaKey: true, altKey: true });

    // Assert
    expect(zoomIn).not.toHaveBeenCalled();
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
        key: '=',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    // Assert
    expect(zoomIn).not.toHaveBeenCalled();
    palette.remove();
  });

  it('does nothing while signed out', () => {
    // Arrange
    const { unmount } = mount(undefined);

    // Act
    press({ key: '=', metaKey: true });
    unmount();

    // Assert
    expect(zoomIn).not.toHaveBeenCalled();
  });

  it('does nothing while explicitly disabled', () => {
    // Arrange
    const { unmount } = mount('user-1', false);

    // Act
    press({ key: '=', metaKey: true });
    unmount();

    // Assert
    expect(zoomIn).not.toHaveBeenCalled();
  });

  it('detaches its listener on unmount', () => {
    // Arrange
    const { unmount } = mount('user-1');

    // Act
    unmount();
    press({ key: '=', metaKey: true });

    // Assert
    expect(zoomIn).not.toHaveBeenCalled();
  });
});
