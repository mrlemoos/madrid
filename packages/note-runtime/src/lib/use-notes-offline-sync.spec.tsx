import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const drainNotesOutbox = vi.fn().mockResolvedValue(false);
const refreshNotesList = vi.fn();
const onlineListeners = new Set<() => void>();
const actions = { current: { refreshNotesList } as unknown };

vi.mock('@getmadrid/data-source/notes-offline-sync', () => ({
  drainNotesOutbox,
}));
vi.mock('@getmadrid/data-source/browser-connectivity', () => ({
  subscribeOnline: (listener: () => void) => {
    onlineListeners.add(listener);
    return () => onlineListeners.delete(listener);
  },
}));
vi.mock('../context/notes-data-context', () => ({
  useOptionalNotesDataActions: () => actions.current,
}));

const { useNotesOfflineSync } = await import('./use-notes-offline-sync');

function mount(userId: string | undefined, enabled = true) {
  function Harness(): null {
    useNotesOfflineSync(userId, enabled);
    return null;
  }
  return render(<Harness />);
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  onlineListeners.clear();
  actions.current = { refreshNotesList };
  drainNotesOutbox.mockResolvedValue(false);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useNotesOfflineSync', () => {
  it('drains once on mount', () => {
    // Arrange|Act
    mount('user-1');

    // Assert
    expect(drainNotesOutbox).toHaveBeenCalledWith('user-1');
  });

  it('refreshes the vault quietly only when something actually synced', async () => {
    // Arrange
    drainNotesOutbox.mockResolvedValue(true);

    // Act
    mount('user-1');
    await vi.waitFor(() => {
      expect(refreshNotesList).toHaveBeenCalled();
    });

    // Assert
    expect(refreshNotesList).toHaveBeenCalledWith({ silent: true });
  });

  it('leaves the list alone when the outbox was already empty', async () => {
    // Arrange|Act
    mount('user-1');
    await Promise.resolve();

    // Assert
    expect(refreshNotesList).not.toHaveBeenCalled();
  });

  it('drains again when the network comes back', () => {
    // Arrange
    mount('user-1');
    drainNotesOutbox.mockClear();

    // Act
    for (const listener of onlineListeners) listener();

    // Assert
    expect(drainNotesOutbox).toHaveBeenCalledTimes(1);
  });

  it('drains when the tab becomes visible again, not when it hides', () => {
    // Arrange
    mount('user-1');
    drainNotesOutbox.mockClear();

    // Act
    setVisibility('hidden');
    const whileHidden = drainNotesOutbox.mock.calls.length;
    setVisibility('visible');

    // Assert
    expect(whileHidden).toBe(0);
    expect(drainNotesOutbox).toHaveBeenCalledTimes(1);
  });

  it('keeps draining on a timer', () => {
    // Arrange
    mount('user-1');
    drainNotesOutbox.mockClear();

    // Act
    vi.advanceTimersByTime(60_000);

    // Assert
    expect(drainNotesOutbox).toHaveBeenCalledTimes(1);
  });

  it('does nothing while signed out or disabled', () => {
    // Arrange|Act
    mount(undefined);
    mount('user-1', false);

    // Assert
    expect(drainNotesOutbox).not.toHaveBeenCalled();
  });

  it('stops the timer and both listeners on unmount', () => {
    // Arrange
    const { unmount } = mount('user-1');
    drainNotesOutbox.mockClear();

    // Act
    unmount();
    vi.advanceTimersByTime(120_000);
    setVisibility('visible');

    // Assert
    expect(onlineListeners.size).toBe(0);
    expect(drainNotesOutbox).not.toHaveBeenCalled();
  });

  it('survives a missing notes-data provider', async () => {
    // Arrange
    actions.current = undefined;
    drainNotesOutbox.mockResolvedValue(true);

    // Act|Assert
    expect(() => mount('user-1')).not.toThrow();
    await Promise.resolve();
  });
});
