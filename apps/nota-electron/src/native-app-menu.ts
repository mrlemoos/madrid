import type { MenuItemConstructorOptions } from 'electron';

export type NotaAppMenuActions = {
  onNewNote: () => void;
  onMoveToFolder: () => void;
  onNewFolder: () => void;
  onNewNoteFromClipboard: () => void;
  onStudyNotesFromRecording: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
};

export type NotaAppMenuTemplateOptions = {
  isMac: boolean;
};

function buildEditSubmenu(isMac: boolean): MenuItemConstructorOptions[] {
  return [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    ...(isMac
      ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const },
          { type: 'separator' as const },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' as const },
              { role: 'stopSpeaking' as const },
            ],
          },
        ]
      : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const },
        ]),
  ] as MenuItemConstructorOptions[];
}

export function buildNotaAppMenuTemplate(
  actions: NotaAppMenuActions,
  options: NotaAppMenuTemplateOptions,
): MenuItemConstructorOptions[] {
  const { isMac } = options;
  return [
    {
      label: 'Nota',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: buildEditSubmenu(isMac),
    },
    {
      label: 'Notes',
      submenu: [
        {
          label: 'New note',
          accelerator: 'CmdOrCtrl+N',
          click: actions.onNewNote,
        },
        {
          label: 'New note from clipboard',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: actions.onNewNoteFromClipboard,
        },
        {
          label: 'Study notes from recording…',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: actions.onStudyNotesFromRecording,
        },
      ],
    },
    {
      label: 'Folders',
      submenu: [
        {
          label: 'Move to folder',
          accelerator: 'CmdOrCtrl+M',
          click: actions.onMoveToFolder,
        },
        {
          label: 'New folder',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: actions.onNewFolder,
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Refresh',
          role: 'reload',
          accelerator: 'CmdOrCtrl+R',
        },
        { type: 'separator' },
        // Drives the SPA's own zoom store (rem scale), not webContents zoom, so
        // the desktop app and the web app scale identically.
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: actions.onZoomIn,
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: actions.onZoomOut,
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: actions.onZoomReset,
        },
        { type: 'separator' },
        {
          label: 'Open Developer Tools',
          role: 'toggleDevTools',
          accelerator: 'Alt+CmdOrCtrl+I',
        },
      ],
    },
  ];
}
