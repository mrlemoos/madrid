import { act, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ElectronUpdateSettingsSection } from './electron-update-settings-section';

function noopUnsubscribe(): void {
  // Test harness: preload returns a no-op cleanup for subscribe* APIs.
}

vi.mock('./use-electron-bridge-translator', () => ({
  useElectronBridgeTranslator: () => ({
    locale: 'en-GB' as const,
    t: (key: string, values?: Record<string, string | number>) => {
      if (key === 'Update {version} is available.' && values?.version) {
        return `Update ${String(values.version)} is available.`;
      }
      if (
        key === 'Downloading update… {percent}%' &&
        values?.percent !== undefined
      ) {
        return `Downloading… ${String(values.percent)}%`;
      }
      return key;
    },
  }),
}));

describe('ElectronUpdateSettingsSection', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'nota');
    vi.restoreAllMocks();
  });

  it('returns null when the shell bridge is missing', () => {
    // Arrange
    Reflect.deleteProperty(window, 'nota');

    // Act
    const { container } = render(<ElectronUpdateSettingsSection />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('shows not-available status from the preload channel', () => {
    // Arrange
    let subscriber: ((payload: unknown) => void) | null = null;
    window.nota = {
      subscribeMenubarActions: vi.fn(() => noopUnsubscribe),
      subscribeUpdateStatus: (cb: (payload: unknown) => void) => {
        subscriber = cb;
        return () => {
          subscriber = null;
        };
      },
      checkForUpdates: vi.fn().mockResolvedValue({ ok: true }),
      quitAndInstall: vi.fn().mockResolvedValue(true),
    };

    render(<ElectronUpdateSettingsSection />);

    // Act
    act(() => {
      subscriber?.({ phase: 'not-available' });
    });

    // Assert
    expect(screen.getByRole('status').textContent).toBe(
      "You're on the latest version.",
    );
  });

  it('invokes checkForUpdates when the button is clicked', () => {
    // Arrange
    const checkForUpdates = vi.fn().mockResolvedValue({ ok: true });
    window.nota = {
      subscribeMenubarActions: vi.fn(() => noopUnsubscribe),
      subscribeUpdateStatus: vi.fn(() => noopUnsubscribe),
      checkForUpdates,
      quitAndInstall: vi.fn().mockResolvedValue(true),
    };

    render(<ElectronUpdateSettingsSection />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Check for updates' }));

    // Assert
    expect(checkForUpdates).toHaveBeenCalledTimes(1);
  });
});
