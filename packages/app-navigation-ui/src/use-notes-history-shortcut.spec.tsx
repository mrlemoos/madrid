import { beforeEach, describe, expect, it, vi } from 'vitest';
import { markNavIntent } from '@getmadrid/nota-motion-ui/panel-motion';

vi.mock('@getmadrid/nota-motion-ui/panel-motion', () => ({
  markNavIntent: vi.fn(),
}));

describe('useNotesHistoryShortcut nav intent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('marks keyboard intent before history.back on Mod+[', async () => {
    // Arrange
    const back = vi.fn();
    const prevWindow = globalThis.window;
    vi.stubGlobal('window', {
      ...prevWindow,
      history: { ...prevWindow.history, back, forward: vi.fn() },
    });
    const { useNotesHistoryShortcut } = await import(
      './use-notes-history-shortcut'
    );
    const { render } = await import('@testing-library/react');
    const { fireEvent } = await import('@testing-library/react');

    function Harness(): null {
      useNotesHistoryShortcut('user-1', true);
      return null;
    }
    render(<Harness />);

    // Act
    fireEvent.keyDown(document, { key: '[', metaKey: true, bubbles: true });

    // Assert
    expect(vi.mocked(markNavIntent)).toHaveBeenCalledWith('keyboard');
    expect(back).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
