import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
  shell,
  Tray,
  type WebContents,
} from 'electron';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  NOTA_CLERK_SSO_CALLBACK_PATH,
  NOTA_CUSTOM_SCHEME_URL_PREFIX,
} from '@nota/clerk-oauth-protocol';
import { buildNotaAppMenuTemplate } from './native-app-menu.js';
import {
  DEV_PORT,
  resolveMainWindowLoadUrl,
  ssoCallbackBaseUrl,
} from './app-load-url.js';
import {
  installClerkFapiCorsPatch,
  isClerkFapiHostname,
} from './clerk-fapi-cors.js';
import {
  registerNotaUpdaterIpc,
  startPackagedNotaUpdater,
} from './nota-updater.js';
import {
  shouldOpenHttpUrlInSystemBrowser,
  shouldOpenInAppOAuthPopupWindow,
} from './window-open-policy.js';

/** Human-readable name for menus, notifications, and `electron-updater` `{appName}` (not `package.json` `name`). */
app.setName('Nota');

registerNotaUpdaterIpc();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;
const isDarwin = process.platform === 'darwin';

/** IPC channel; keep in sync with `apps/nota-electron/src/preload.cts`. */
const NOTA_MENUBAR_ACTION_CHANNEL = 'nota-menubar-action';

/** IPC channel; keep in sync with `apps/nota-electron/src/preload.cts`. */
const NOTA_WINDOW_BUTTONS_SET_VISIBLE_CHANNEL =
  'nota-window-buttons:set-visible';

ipcMain.handle(
  NOTA_WINDOW_BUTTONS_SET_VISIBLE_CHANNEL,
  (_event, visible: unknown) => {
    if (!isDarwin || !mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    mainWindow.setWindowButtonVisibility(visible === true);
  },
);

/** Same cap as `IMAGE_MAX_BYTES` in nota (`pdf-attachment-client`). */
const CLIPBOARD_IMAGE_MAX_BYTES = 25 * 1024 * 1024;

let pendingSsoHttpUrl: string | null = null;

let mainWindow: BrowserWindow | null = null;

let tray: Tray | null = null;

/**
 * Clerk OAuth opens `window.open` popups (then IdPs like Apple). On macOS, Chromium’s WebAuthn /
 * FIDO path inside **sandboxed** child windows often never surfaces Touch ID / passkey UI (stuck
 * spinner on appleid.apple.com). Use a non-sandboxed renderer for those popups only; keep the main
 * app window sandboxed.
 *
 * Nested `window.open` calls must get the same handler — attach via `did-create-window`.
 */
function browserWindowOptionsForOAuthPopup(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 500,
    height: 720,
    minWidth: 400,
    minHeight: 560,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  };
}

function attachOauthPopupOpenHandler(contents: WebContents): void {
  contents.setWindowOpenHandler((details) => {
    if (shouldOpenInAppOAuthPopupWindow(details.url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: browserWindowOptionsForOAuthPopup(),
      };
    }
    if (shouldOpenHttpUrlInSystemBrowser(details.url)) {
      void shell.openExternal(details.url);
    }
    return { action: 'deny' };
  });
}

function wireOauthPopupChain(contents: WebContents): void {
  attachOauthPopupOpenHandler(contents);
  contents.on('did-create-window', (childWindow: BrowserWindow) => {
    wireOauthPopupChain(childWindow.webContents);
  });
}

function notaProtocolOAuthUrlToSsoHttpUrl(protocolUrl: string): string | null {
  if (!protocolUrl.startsWith(NOTA_CUSTOM_SCHEME_URL_PREFIX)) {
    return null;
  }
  try {
    const u = new URL(protocolUrl);
    const search = u.search;
    const base = ssoCallbackBaseUrl(isDev);
    return `${base}${NOTA_CLERK_SSO_CALLBACK_PATH}${search}`;
  } catch {
    return null;
  }
}

function resolveTrayIconPath(): string | null {
  const devPath = path.join(__dirname, '../buildResources/TrayTemplate.png');
  if (existsSync(devPath)) {
    return devPath;
  }
  const packagedPath = path.join(process.resourcesPath, 'TrayTemplate.png');
  if (existsSync(packagedPath)) {
    return packagedPath;
  }
  console.warn(
    '[nota-electron] TrayTemplate.png not found; menu bar extra disabled.',
  );
  return null;
}

function dockIconFileName(): 'icon-dark.png' | 'icon.png' {
  return nativeTheme.shouldUseDarkColors ? 'icon-dark.png' : 'icon.png';
}

/**
 * macOS Dock icon: follow system light/dark (same mark as web `favicon.svg` dark branch).
 * Bundle `.icns` stays the light asset; this overrides the Dock at runtime.
 */
function resolveDockIconPath(): string | null {
  const name = dockIconFileName();
  const devPath = path.join(__dirname, '../buildResources', name);
  if (existsSync(devPath)) {
    return devPath;
  }
  const packagedPath = path.join(process.resourcesPath, name);
  if (existsSync(packagedPath)) {
    return packagedPath;
  }
  return null;
}

function applyDockIcon(): void {
  if (!isDarwin || !app.dock) {
    return;
  }
  const iconPath = resolveDockIconPath();
  if (!iconPath) {
    return;
  }
  const image = nativeImage.createFromPath(iconPath);
  if (image.isEmpty()) {
    console.warn(
      `[nota-electron] Dock icon could not be loaded from ${iconPath}.`,
    );
    return;
  }
  app.dock.setIcon(image);
}

function ensureMainWindow(): BrowserWindow {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
  }
  const win = mainWindow;
  if (!win) {
    throw new Error('[nota-electron] main window missing after createWindow');
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
  return win;
}

function sendMenubarAction(payload: object): void {
  const win = ensureMainWindow();
  win.webContents.send(NOTA_MENUBAR_ACTION_CHANNEL, payload);
}

type ClipboardReadResult =
  | { ok: true; payload: object }
  | { ok: false; reason: 'empty' | 'image_too_large' };

function readClipboardForNote(): ClipboardReadResult {
  const img = clipboard.readImage();
  if (!img.isEmpty()) {
    const png = img.toPNG();
    if (png.length > CLIPBOARD_IMAGE_MAX_BYTES) {
      return { ok: false, reason: 'image_too_large' };
    }
    return {
      ok: true,
      payload: {
        kind: 'clipboard-note',
        clipboard: {
          kind: 'image',
          base64: png.toString('base64'),
          mimeType: 'image/png' as const,
        },
      },
    };
  }
  const raw = clipboard.readText();
  if (!raw.trim()) {
    return { ok: false, reason: 'empty' };
  }
  return {
    ok: true,
    payload: {
      kind: 'clipboard-note',
      clipboard: { kind: 'text', text: raw },
    },
  };
}

function createTray(): void {
  const iconPath = resolveTrayIconPath();
  if (!iconPath) {
    return;
  }
  const icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    console.warn(
      '[nota-electron] Tray icon could not be loaded; menu bar extra disabled.',
    );
    return;
  }
  tray = new Tray(icon);
  tray.setToolTip('Nota');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'New note from clipboard',
        click: () => {
          const win = ensureMainWindow();
          const result = readClipboardForNote();
          if (!result.ok) {
            if (result.reason === 'image_too_large') {
              void dialog.showMessageBox(win, {
                type: 'warning',
                message: 'Clipboard image is too large (max 25 MB).',
              });
              return;
            }
            void dialog.showMessageBox(win, {
              type: 'info',
              message: 'Clipboard is empty.',
            });
            return;
          }
          sendMenubarAction(result.payload);
        },
      },
      {
        label: 'Study notes from recording…',
        click: () => {
          sendMenubarAction({ kind: 'study-recording' });
        },
      },
      { type: 'separator' },
      {
        label: 'Open Nota',
        click: () => {
          ensureMainWindow();
        },
      },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]),
  );
}

function installApplicationMenu(): void {
  if (!isDarwin) {
    return;
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(
      buildNotaAppMenuTemplate(
        {
          onNewNote: () => {
            sendMenubarAction({ kind: 'create-note' });
          },
          onMoveToFolder: () => {
            sendMenubarAction({ kind: 'move-note' });
          },
          onNewFolder: () => {
            sendMenubarAction({ kind: 'create-folder' });
          },
          onNewNoteFromClipboard: () => {
            sendMenubarAction({ kind: 'clipboard-note' });
          },
          onStudyNotesFromRecording: () => {
            sendMenubarAction({ kind: 'study-recording' });
          },
          onZoomIn: () => {
            sendMenubarAction({ kind: 'zoom-in' });
          },
          onZoomOut: () => {
            sendMenubarAction({ kind: 'zoom-out' });
          },
          onZoomReset: () => {
            sendMenubarAction({ kind: 'zoom-reset' });
          },
        },
        { isMac: isDarwin },
      ),
    ),
  );
}

function queueOrDeliverSsoFromNotaProtocol(protocolUrl: string): void {
  const mapped = notaProtocolOAuthUrlToSsoHttpUrl(protocolUrl);
  if (!mapped) {
    return;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    void mainWindow.loadURL(mapped);
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    return;
  }
  pendingSsoHttpUrl = mapped;
}

/**
 * Clerk `signIn.sso` assigns `window.location` to the hosted OAuth URL. In Electron, Apple / passkey
 * flows must run in the **system browser**; intercept main-window navigations to HTTPS IdP/Clerk OAuth.
 */
function shouldOpenHttpsNavigationInSystemBrowser(url: string): boolean {
  try {
    const u = new URL(url);
    const { hostname } = u;
    if (
      hostname === 'checkout.stripe.com' ||
      hostname === 'pay.stripe.com' ||
      hostname === 'buy.stripe.com' ||
      hostname === 'billing.stripe.com' ||
      hostname === 'invoice.stripe.com'
    ) {
      return true;
    }
  } catch {
    return false;
  }
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') {
      return false;
    }
    const h = u.hostname.toLowerCase();
    return (
      h === 'appleid.apple.com' ||
      h === 'id.apple.com' ||
      h === 'accounts.google.com' ||
      h === 'github.com' ||
      isClerkFapiHostname(h)
    );
  } catch {
    return false;
  }
}

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.cjs');

  if (!existsSync(preloadPath)) {
    console.error(
      `[nota-electron] Preload missing at ${preloadPath}. Build the shell: cd apps/nota-electron && npm run build`,
    );
  } else if (isDev) {
    console.log(`[nota-electron] Preload ok: ${preloadPath}`);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    transparent: true,
    // Without vibrancy, transparent windows often composite as solid black on macOS.
    ...(isDarwin
      ? {
          vibrancy: 'under-window' as const,
          visualEffectState: 'followWindow' as const,
        }
      : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: preloadPath,
    },
  });

  const win = mainWindow;

  wireOauthPopupChain(win.webContents);

  win.webContents.on('will-navigate', (event, url) => {
    if (!shouldOpenHttpsNavigationInSystemBrowser(url)) {
      return;
    }
    event.preventDefault();
    void shell.openExternal(url);
  });

  // Load the app (or resume Clerk OAuth handshake from a `nota://` deep link).
  if (pendingSsoHttpUrl) {
    const resume = pendingSsoHttpUrl;
    pendingSsoHttpUrl = null;
    void win.loadURL(resume);
  } else {
    void win.loadURL(resolveMainWindowLoadUrl(isDev));
  }

  win.on('closed', () => {
    mainWindow = null;
  });
}

async function startServer(): Promise<void> {
  if (!isDev) {
    return;
  }
  const waitOn = (await import('wait-on')).default;
  await waitOn({
    resources: [`http://localhost:${String(DEV_PORT)}`],
    // Cold `nx run-many -t dev` builds all dependency libs before Vite serves
    // 4200; that can exceed 30s on a fresh cache, timing out electron and
    // quitting the app. Give the cold build room — warm starts still connect in
    // seconds.
    timeout: 120_000,
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const protocolUrl = argv.find(
      (a): a is string =>
        typeof a === 'string' && a.startsWith(NOTA_CUSTOM_SCHEME_URL_PREFIX),
    );
    if (protocolUrl) {
      queueOrDeliverSsoFromNotaProtocol(protocolUrl);
    }
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  void app.whenReady().then(async () => {
    try {
      if (process.defaultApp) {
        if (process.argv.length >= 2) {
          app.setAsDefaultProtocolClient('nota', process.execPath, [
            path.resolve(process.argv[1] ?? ''),
          ]);
        }
      } else {
        app.setAsDefaultProtocolClient('nota');
      }

      if (isDarwin) {
        app.on('open-url', (event, url) => {
          event.preventDefault();
          if (url.startsWith(NOTA_CUSTOM_SCHEME_URL_PREFIX)) {
            queueOrDeliverSsoFromNotaProtocol(url);
          }
        });
      }

      installClerkFapiCorsPatch();
      await startServer();
      createWindow();
      installApplicationMenu();
      createTray();
      applyDockIcon();
      nativeTheme.on('updated', applyDockIcon);
      await startPackagedNotaUpdater();
    } catch (error) {
      console.error('Failed to start app:', error);
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
