import { contextBridge, ipcRenderer } from 'electron';

/** Keep in sync with `nota-updater-channels.ts` (preload cannot `require` sibling asar modules). */
const NOTA_UPDATES_STATUS_CHANNEL = 'nota-updates:status';
const NOTA_UPDATES_CHECK_CHANNEL = 'nota-updates:check';
const NOTA_UPDATES_QUIT_INSTALL_CHANNEL = 'nota-updates:quit-install';

const NOTA_MENUBAR_ACTION_CHANNEL = 'nota-menubar-action';

const NOTA_WINDOW_BUTTONS_SET_VISIBLE_CHANNEL = 'nota-window-buttons:set-visible';

const pending: unknown[] = [];
const listeners = new Set<(payload: unknown) => void>();

function dispatch(payload: unknown): void {
  if (listeners.size > 0) {
    for (const fn of listeners) {
      fn(payload);
    }
  } else {
    pending.push(payload);
  }
}

ipcRenderer.on(NOTA_MENUBAR_ACTION_CHANNEL, (_event, payload: unknown) => {
  dispatch(payload);
});

const updatePending: unknown[] = [];
const updateListeners = new Set<(payload: unknown) => void>();

function dispatchUpdateStatus(payload: unknown): void {
  if (updateListeners.size > 0) {
    for (const fn of updateListeners) {
      fn(payload);
    }
  } else {
    updatePending.push(payload);
  }
}

ipcRenderer.on(NOTA_UPDATES_STATUS_CHANNEL, (_event, payload: unknown) => {
  dispatchUpdateStatus(payload);
});

contextBridge.exposeInMainWorld('nota', {
  subscribeMenubarActions(cb: (payload: unknown) => void): () => void {
    listeners.add(cb);
    while (pending.length > 0) {
      const next = pending.shift();
      if (next !== undefined) {
        cb(next);
      }
    }
    return () => {
      listeners.delete(cb);
    };
  },

  subscribeUpdateStatus(cb: (payload: unknown) => void): () => void {
    updateListeners.add(cb);
    while (updatePending.length > 0) {
      const next = updatePending.shift();
      if (next !== undefined) {
        cb(next);
      }
    }
    return () => {
      updateListeners.delete(cb);
    };
  },

  checkForUpdates(): Promise<{
    ok: boolean;
    reason?: 'development' | 'not-initialised' | 'check-failed';
  }> {
    return ipcRenderer.invoke(NOTA_UPDATES_CHECK_CHANNEL);
  },

  quitAndInstall(): Promise<boolean> {
    return ipcRenderer.invoke(NOTA_UPDATES_QUIT_INSTALL_CHANNEL);
  },

  setWindowButtonVisibility(visible: boolean): Promise<void> {
    return ipcRenderer.invoke(NOTA_WINDOW_BUTTONS_SET_VISIBLE_CHANNEL, visible);
  },
});
