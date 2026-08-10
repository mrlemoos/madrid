import { describe, expect, it, vi } from 'vitest';
import type { MenuItemConstructorOptions } from 'electron';
import { buildNotaAppMenuTemplate } from './native-app-menu.js';

function submenuOf(
  template: MenuItemConstructorOptions[],
  label: string,
): MenuItemConstructorOptions[] {
  const top = template.find((m) => m.label === label);
  const sub = top?.submenu;
  return Array.isArray(sub) ? sub : [];
}

function rolesOnly(
  items: MenuItemConstructorOptions[],
): NonNullable<MenuItemConstructorOptions['role']>[] {
  return items
    .filter(
      (
        i,
      ): i is MenuItemConstructorOptions & {
        role: NonNullable<typeof i.role>;
      } => 'role' in i && i.role != null,
    )
    .map((i) => i.role);
}

function noopActions() {
  return {
    onNewNote: vi.fn(),
    onMoveToFolder: vi.fn(),
    onNewFolder: vi.fn(),
    onNewNoteFromClipboard: vi.fn(),
    onStudyNotesFromRecording: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onZoomReset: vi.fn(),
  };
}

describe('buildNotaAppMenuTemplate', () => {
  it('includes Nota app submenu roles in order', () => {
    // Arrange
    const actions = noopActions();

    // Act
    const template = buildNotaAppMenuTemplate(actions, { isMac: true });

    // Assert
    const notaItems = submenuOf(template, 'Nota');
    expect(rolesOnly(notaItems)).toEqual([
      'about',
      'services',
      'hide',
      'hideOthers',
      'unhide',
      'quit',
    ]);
  });

  it('uses native quit without a custom click handler', () => {
    // Arrange
    const actions = noopActions();

    // Act
    const template = buildNotaAppMenuTemplate(actions, { isMac: true });
    const notaItems = submenuOf(template, 'Nota');
    const quitItem = notaItems.find(
      (i): i is MenuItemConstructorOptions & { role: 'quit' } =>
        'role' in i && i.role === 'quit',
    );

    // Assert
    expect(quitItem).toEqual({ role: 'quit' });
    expect(
      quitItem && 'click' in quitItem ? quitItem.click : undefined,
    ).toBeUndefined();
  });

  it('includes Edit menu with macOS-specific items when isMac is true', () => {
    // Arrange
    const actions = noopActions();

    // Act
    const template = buildNotaAppMenuTemplate(actions, { isMac: true });

    // Assert
    const editItems = submenuOf(template, 'Edit');
    expect(editItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'undo' }),
        expect.objectContaining({ role: 'pasteAndMatchStyle' }),
        expect.objectContaining({ role: 'selectAll' }),
        expect.objectContaining({
          label: 'Speech',
          submenu: [
            expect.objectContaining({ role: 'startSpeaking' }),
            expect.objectContaining({ role: 'stopSpeaking' }),
          ],
        }),
      ]),
    );
  });

  it('includes Edit menu without Speech when isMac is false', () => {
    // Arrange
    const actions = noopActions();

    // Act
    const template = buildNotaAppMenuTemplate(actions, { isMac: false });

    // Assert
    const editItems = submenuOf(template, 'Edit');
    expect(editItems.some((i) => i.label === 'Speech')).toBe(false);
    expect(editItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'undo' }),
        expect.objectContaining({ role: 'delete' }),
        expect.objectContaining({ role: 'selectAll' }),
      ]),
    );
    expect(
      editItems.some((i) => 'role' in i && i.role === 'pasteAndMatchStyle'),
    ).toBe(false);
  });

  it('includes note actions with accelerators', () => {
    // Arrange
    const actions = noopActions();

    // Act
    const template = buildNotaAppMenuTemplate(actions, { isMac: true });

    // Assert
    const notesItems = submenuOf(template, 'Notes');
    const foldersItems = submenuOf(template, 'Folders');
    expect(notesItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'New note',
          accelerator: 'CmdOrCtrl+N',
        }),
        expect.objectContaining({
          label: 'New note from clipboard',
          accelerator: 'CmdOrCtrl+Shift+N',
        }),
        expect.objectContaining({
          label: 'Study notes from recording…',
          accelerator: 'CmdOrCtrl+Shift+R',
        }),
      ]),
    );
    expect(foldersItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Move to folder',
          accelerator: 'CmdOrCtrl+M',
        }),
        expect.objectContaining({
          label: 'New folder',
          accelerator: 'CmdOrCtrl+Shift+N',
        }),
      ]),
    );
  });

  it('includes View refresh and developer tools with roles', () => {
    // Arrange
    const actions = noopActions();

    // Act
    const template = buildNotaAppMenuTemplate(actions, { isMac: true });

    // Assert
    const viewItems = submenuOf(template, 'View');
    expect(viewItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Refresh',
          role: 'reload',
          accelerator: 'CmdOrCtrl+R',
        }),
        expect.objectContaining({
          label: 'Open Developer Tools',
          role: 'toggleDevTools',
          accelerator: 'Alt+CmdOrCtrl+I',
        }),
      ]),
    );
  });

  it('wires click handlers to the provided callbacks', () => {
    // Arrange
    const onNewNote = vi.fn();
    const onMoveToFolder = vi.fn();
    const onNewFolder = vi.fn();
    const onNewNoteFromClipboard = vi.fn();
    const onStudyNotesFromRecording = vi.fn();
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onZoomReset = vi.fn();

    // Act
    const template = buildNotaAppMenuTemplate(
      {
        onNewNote,
        onMoveToFolder,
        onNewFolder,
        onNewNoteFromClipboard,
        onStudyNotesFromRecording,
        onZoomIn,
        onZoomOut,
        onZoomReset,
      },
      { isMac: true },
    );
    const notesItems = submenuOf(template, 'Notes') as Array<{
      label?: string;
      click?: () => void;
    }>;
    const foldersItems = submenuOf(template, 'Folders') as Array<{
      label?: string;
      click?: () => void;
    }>;
    notesItems.find((item) => item.label === 'New note')?.click?.();
    notesItems
      .find((item) => item.label === 'New note from clipboard')
      ?.click?.();
    notesItems
      .find((item) => item.label === 'Study notes from recording…')
      ?.click?.();
    foldersItems.find((item) => item.label === 'Move to folder')?.click?.();
    foldersItems.find((item) => item.label === 'New folder')?.click?.();
    const viewItems = submenuOf(template, 'View') as Array<{
      label?: string;
      click?: () => void;
    }>;
    viewItems.find((item) => item.label === 'Zoom In')?.click?.();
    viewItems.find((item) => item.label === 'Zoom Out')?.click?.();
    viewItems.find((item) => item.label === 'Actual Size')?.click?.();

    // Assert
    expect(onNewNote).toHaveBeenCalledTimes(1);
    expect(onMoveToFolder).toHaveBeenCalledTimes(1);
    expect(onNewFolder).toHaveBeenCalledTimes(1);
    expect(onNewNoteFromClipboard).toHaveBeenCalledTimes(1);
    expect(onStudyNotesFromRecording).toHaveBeenCalledTimes(1);
    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onZoomReset).toHaveBeenCalledTimes(1);
  });
});
