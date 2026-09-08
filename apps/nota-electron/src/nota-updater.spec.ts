import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const handlers = new Map<string, (...args: unknown[]) => unknown>();
const sent: { channel: string; payload: unknown }[] = [];
const app = { isPackaged: true };
const windows = {
  current: [
    {
      isDestroyed: () => false,
      webContents: {
        send: (channel: string, payload: unknown) =>
          sent.push({ channel, payload }),
      },
    },
  ],
};
const autoUpdater = {
  autoDownload: false,
  listeners: new Map<string, (arg?: unknown) => void>(),
  on(event: string, fn: (arg?: unknown) => void) {
    this.listeners.set(event, fn);
    return this;
  },
  checkForUpdates: vi.fn().mockResolvedValue(undefined),
  quitAndInstall: vi.fn(),
};

vi.mock('electron', () => ({
  app,
  BrowserWindow: { getAllWindows: () => windows.current },
  ipcMain: {
    handle: (channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers.set(channel, fn);
    },
  },
}));
vi.mock('electron-updater', () => ({ default: { autoUpdater } }));

/** Fresh module per test: listener attachment and the updater ref are module state. */
async function loadModule() {
  vi.resetModules();
  handlers.clear();
  sent.length = 0;
  autoUpdater.listeners.clear();
  autoUpdater.checkForUpdates.mockClear().mockResolvedValue(undefined);
  autoUpdater.quitAndInstall.mockClear();
  return import('./nota-updater.js');
}

function statuses() {
  return sent
    .filter((s) => s.channel === 'nota-updates:status')
    .map((s) => s.payload);
}

beforeEach(() => {
  app.isPackaged = true;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('startPackagedNotaUpdater', () => {
  it('does nothing in development, where there is nothing to update', async () => {
    // Arrange
    app.isPackaged = false;
    const { startPackagedNotaUpdater } = await loadModule();

    // Act
    await startPackagedNotaUpdater();

    // Assert
    expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
  });

  it('downloads automatically and checks once on launch', async () => {
    // Arrange
    const { startPackagedNotaUpdater } = await loadModule();

    // Act
    await startPackagedNotaUpdater();

    // Assert
    expect(autoUpdater.autoDownload).toBe(true);
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
  });

  it('reports a failed launch check instead of throwing into main', async () => {
    // Arrange
    const { startPackagedNotaUpdater } = await loadModule();
    autoUpdater.checkForUpdates.mockRejectedValue(new Error('no network'));

    // Act
    await startPackagedNotaUpdater();

    // Assert
    expect(statuses()).toContainEqual({
      phase: 'error',
      message: 'no network',
    });
  });

  it('broadcasts each updater event to the renderer', async () => {
    // Arrange
    const { startPackagedNotaUpdater } = await loadModule();
    await startPackagedNotaUpdater();

    // Act
    autoUpdater.listeners.get('checking-for-update')?.();
    autoUpdater.listeners.get('update-available')?.({ version: '1.2.0' });
    autoUpdater.listeners.get('update-not-available')?.();
    autoUpdater.listeners.get('download-progress')?.({ percent: 42.6 });
    autoUpdater.listeners.get('update-downloaded')?.({ version: '1.2.0' });

    // Assert
    expect(statuses()).toEqual(
      expect.arrayContaining([
        { phase: 'checking' },
        { phase: 'available', version: '1.2.0' },
        { phase: 'not-available' },
        { phase: 'downloading', percent: 43 },
        { phase: 'downloaded', version: '1.2.0' },
      ]),
    );
  });

  it('turns a non-Error updater failure into a readable message', async () => {
    // Arrange
    const { startPackagedNotaUpdater } = await loadModule();
    await startPackagedNotaUpdater();

    // Act
    autoUpdater.listeners.get('error')?.('ENOTFOUND');
    autoUpdater.listeners.get('error')?.({ weird: true });

    // Assert
    expect(statuses()).toContainEqual({
      phase: 'error',
      message: 'ENOTFOUND',
    });
    expect(statuses()).toContainEqual({
      phase: 'error',
      message: 'Unknown error',
    });
  });

  it('attaches its listeners only once', async () => {
    // Arrange
    const { startPackagedNotaUpdater } = await loadModule();
    await startPackagedNotaUpdater();
    const attach = vi.spyOn(autoUpdater, 'on');

    // Act
    await startPackagedNotaUpdater();

    // Assert — a second set would broadcast every status twice
    expect(attach).not.toHaveBeenCalled();
  });

  it('skips a window that has already closed', async () => {
    // Arrange
    const { startPackagedNotaUpdater } = await loadModule();
    await startPackagedNotaUpdater();
    const send = vi.fn();
    windows.current = [{ isDestroyed: () => true, webContents: { send } }];

    // Act
    autoUpdater.listeners.get('checking-for-update')?.();

    // Assert
    expect(send).not.toHaveBeenCalled();
    windows.current = [
      {
        isDestroyed: () => false,
        webContents: {
          send: (channel: string, payload: unknown) =>
            sent.push({ channel, payload }),
        },
      },
    ];
  });
});

describe('registerNotaUpdaterIpc', () => {
  it('tells the renderer updates are unavailable in development', async () => {
    // Arrange
    app.isPackaged = false;
    const { registerNotaUpdaterIpc } = await loadModule();
    registerNotaUpdaterIpc();

    // Act
    const result = await handlers.get('nota-updates:check')?.();

    // Assert
    expect(result).toEqual({ ok: false, reason: 'development' });
    expect(statuses()).toContainEqual({
      phase: 'unavailable',
      reason: 'development',
    });
  });

  it('reports when a check runs before the updater started', async () => {
    // Arrange
    const { registerNotaUpdaterIpc } = await loadModule();
    registerNotaUpdaterIpc();

    // Act
    const result = await handlers.get('nota-updates:check')?.();

    // Assert
    expect(result).toEqual({ ok: false, reason: 'not-initialised' });
  });

  it('checks on request once the updater is running', async () => {
    // Arrange
    const { registerNotaUpdaterIpc, startPackagedNotaUpdater } =
      await loadModule();
    registerNotaUpdaterIpc();
    await startPackagedNotaUpdater();
    autoUpdater.checkForUpdates.mockClear();

    // Act
    const result = await handlers.get('nota-updates:check')?.();

    // Assert
    expect(result).toEqual({ ok: true });
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
  });

  it('reports a failed manual check', async () => {
    // Arrange
    const { registerNotaUpdaterIpc, startPackagedNotaUpdater } =
      await loadModule();
    registerNotaUpdaterIpc();
    await startPackagedNotaUpdater();
    autoUpdater.checkForUpdates.mockRejectedValue(new Error('offline'));

    // Act
    const result = await handlers.get('nota-updates:check')?.();

    // Assert
    expect(result).toEqual({ ok: false, reason: 'check-failed' });
    expect(statuses()).toContainEqual({ phase: 'error', message: 'offline' });
  });

  it('restarts into the update, keeping the app open for other windows', async () => {
    // Arrange
    const { registerNotaUpdaterIpc, startPackagedNotaUpdater } =
      await loadModule();
    registerNotaUpdaterIpc();
    await startPackagedNotaUpdater();

    // Act
    const result = await handlers.get('nota-updates:quit-install')?.();

    // Assert
    expect(result).toBe(true);
    expect(autoUpdater.quitAndInstall).toHaveBeenCalledWith(false, true);
  });

  it('refuses to restart in development', async () => {
    // Arrange
    app.isPackaged = false;
    const { registerNotaUpdaterIpc } = await loadModule();
    registerNotaUpdaterIpc();

    // Act
    const result = await handlers.get('nota-updates:quit-install')?.();

    // Assert
    expect(result).toBe(false);
    expect(autoUpdater.quitAndInstall).not.toHaveBeenCalled();
  });
});
