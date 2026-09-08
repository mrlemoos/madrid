import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Folder } from '@getmadrid/database-types';

const createFolder = vi.fn();

vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  getBrowserClient: () => ({ client: 'browser' }),
}));
vi.mock('@getmadrid/data-source/models/folders', () => ({ createFolder }));

const { FolderCreateDialog } = await import('./folder-create-dialog');

const ROW = { id: 'folder-1', name: 'Reading' } as Folder;

function props(overrides: Record<string, unknown> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    userId: 'user-1',
    insertFolderSorted: vi.fn(),
    refreshNotesList: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as Parameters<typeof FolderCreateDialog>[0] & {
    onOpenChange: ReturnType<typeof vi.fn>;
    insertFolderSorted: ReturnType<typeof vi.fn>;
    refreshNotesList: ReturnType<typeof vi.fn>;
  };
}

function typeName(value: string) {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value } });
}

beforeEach(() => {
  vi.clearAllMocks();
  createFolder.mockResolvedValue(ROW);
});

describe('FolderCreateDialog', () => {
  it('titles itself for a root folder', () => {
    // Arrange|Act
    render(<FolderCreateDialog {...props()} />);

    // Assert
    expect(screen.getByText('New folder')).toBeTruthy();
  });

  it('titles itself for a nested folder', () => {
    // Arrange|Act
    render(<FolderCreateDialog {...props({ parentFolderId: 'folder-0' })} />);

    // Assert
    expect(screen.getByText('New subfolder')).toBeTruthy();
  });

  it('refuses a blank name and says so', async () => {
    // Arrange
    render(<FolderCreateDialog {...props()} />);
    typeName('   ');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Enter a folder name.',
    );
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('creates a trimmed folder under the given parent and closes', async () => {
    // Arrange
    const p = props({ parentFolderId: 'folder-0' });
    render(<FolderCreateDialog {...p} />);
    typeName('  Reading  ');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Assert
    await waitFor(() => {
      expect(p.onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(createFolder).toHaveBeenCalledWith(
      { client: 'browser' },
      'user-1',
      'Reading',
      'folder-0',
    );
    expect(p.insertFolderSorted).toHaveBeenCalledWith(ROW);
    expect(p.refreshNotesList).toHaveBeenCalledWith({ silent: true });
  });

  it('creates on Enter, without submitting the surrounding form', async () => {
    // Arrange
    render(<FolderCreateDialog {...props()} />);
    typeName('Reading');

    // Act
    fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Enter' });

    // Assert
    await waitFor(() => {
      expect(createFolder).toHaveBeenCalled();
    });
  });

  it('hands the new folder to the caller before refreshing', async () => {
    // Arrange
    const onCreated = vi.fn().mockResolvedValue(undefined);
    render(<FolderCreateDialog {...props({ onCreated })} />);
    typeName('Reading');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Assert
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(ROW);
    });
  });

  it('keeps the dialog open and shows why when the write fails', async () => {
    // Arrange
    createFolder.mockRejectedValue(new Error('row-level security'));
    const p = props();
    render(<FolderCreateDialog {...p} />);
    typeName('Reading');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'row-level security',
    );
    expect(p.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('does nothing while signed out', () => {
    // Arrange
    render(<FolderCreateDialog {...props({ userId: undefined })} />);
    typeName('Reading');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    // Assert
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('clears the typed name when the dialog is dismissed', async () => {
    // Arrange
    const p = props();
    const { rerender } = render(<FolderCreateDialog {...p} />);
    typeName('Reading');

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    rerender(<FolderCreateDialog {...p} open={false} />);
    rerender(<FolderCreateDialog {...p} open />);

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveProperty('value', '');
    });
    expect(p.onOpenChange).toHaveBeenCalledWith(false);
  });
});
