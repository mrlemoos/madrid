import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note, NoteAttachment } from '@getmadrid/database-types';

const patchNote = vi.fn();
const refreshNotesList = vi.fn().mockResolvedValue(undefined);
const setSticky = vi.fn();
const resetSticky = vi.fn();
const scrollRootRef = { current: null as HTMLElement | null };
const uploadNoteAttachmentFile = vi.fn();
const meta = { current: { notaProEntitled: true } };
const tiptapProps = { current: null as Record<string, unknown> | null };

vi.mock('@getmadrid/editor', async () => {
  const actual =
    await vi.importActual<typeof import('@getmadrid/editor')>(
      '@getmadrid/editor',
    );
  return {
    ...actual,
    TipTapEditor: (props: Record<string, unknown>) => {
      tiptapProps.current = props;
      return <div data-testid="tiptap" />;
    },
  };
});
vi.mock('@getmadrid/note-runtime/sticky-doc-title', () => ({
  useStickyDocTitle: () => ({
    scrollRootRef,
    scrollRootEpoch: 0,
    setSticky,
    resetSticky,
    registerScrollRoot: vi.fn(),
    sticky: { visible: false, label: '' },
  }),
}));
vi.mock('@getmadrid/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataMeta: () => meta.current,
  useNotesDataActions: () => ({ refreshNotesList }),
}));
vi.mock('@getmadrid/data-source/vault-runtime', () => ({
  vaultMutator: { patchNote },
}));
vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  getBrowserClient: () => ({ storage: { from: () => ({}) } }),
}));
vi.mock('@getmadrid/data-source/pdf-attachment-client', () => ({
  uploadNoteAttachmentFile,
  classifyNoteAttachmentFile: () => 'image',
  isImageFile: (file: File) => file.type.startsWith('image/'),
  getOrFetchNoteAttachmentSignedUrl: vi.fn(),
  downloadBlobFromSignedUrl: vi.fn(),
}));
vi.mock('./notes-yjs/use-note-yjs-doc', () => ({
  useNoteYjsDoc: () => ({ ydoc: { doc: true }, synced: true }),
}));

const { NoteEditor } = await import('./note-editor');

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    user_id: 'user-1',
    title: 'Boarding pass',
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-03-04T10:00:00.000Z',
    editor_settings: {},
    banner_attachment_id: null,
    folder_id: null,
    share_token: null,
    due_at: null,
    is_deadline: false,
    ...overrides,
  };
}

function renderEditor(overrides: Partial<Note> = {}) {
  return render(
    <NoteEditor
      note={note(overrides)}
      noteMentionCandidates={[]}
      attachments={[] as NoteAttachment[]}
      titleFontClassName="font-serif"
      bodyFontClassName="font-sans"
    />,
  );
}

function titleField() {
  return screen.getByLabelText('Note title');
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  meta.current = { notaProEntitled: true };
  patchNote.mockResolvedValue({ outcome: 'patched-local' });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('NoteEditor title', () => {
  it('shows the stored title', () => {
    // Arrange|Act
    renderEditor();

    // Assert
    expect(titleField().value).toBe('Boarding pass');
  });

  it('shows the saving indicator as soon as the reader types', () => {
    // Arrange
    renderEditor();

    // Act
    fireEvent.change(titleField(), { target: { value: 'Renamed' } });

    // Assert
    expect(screen.getByRole('status', { name: 'Saving' })).toBeTruthy();
  });

  it('saves the title once typing settles, not on every keystroke', async () => {
    // Arrange
    renderEditor();

    // Act
    fireEvent.change(titleField(), { target: { value: 'R' } });
    fireEvent.change(titleField(), { target: { value: 'Renamed' } });
    expect(patchNote).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(800);
      await Promise.resolve();
    });

    // Assert
    await waitFor(() => {
      expect(patchNote).toHaveBeenCalledTimes(1);
    });
    expect(patchNote).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        noteId: 'note-1',
        fields: expect.objectContaining({ title: 'Renamed' }),
      }),
    );
  });

  it('stores an emptied title as the untitled label', async () => {
    // Arrange
    renderEditor();

    // Act
    fireEvent.change(titleField(), { target: { value: '   ' } });
    await act(async () => {
      vi.advanceTimersByTime(800);
      await Promise.resolve();
    });

    // Assert
    await waitFor(() => {
      expect(patchNote).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          fields: expect.objectContaining({ title: 'Untitled Note' }),
        }),
      );
    });
  });

  it('does not write when the title has not actually changed', async () => {
    // Arrange
    renderEditor();

    // Act
    fireEvent.change(titleField(), { target: { value: 'Boarding pass' } });
    await act(async () => {
      vi.advanceTimersByTime(800);
      await Promise.resolve();
    });

    // Assert
    expect(patchNote).not.toHaveBeenCalled();
  });

  it('publishes the title to the sticky header', () => {
    // Arrange|Act
    renderEditor();

    // Assert
    expect(setSticky).toHaveBeenCalledWith({ label: 'Boarding pass' });
  });

  it('resets its state when the editor switches notes', () => {
    // Arrange
    const { rerender } = renderEditor();

    // Act
    rerender(
      <NoteEditor
        note={note({ id: 'note-2', title: 'Second' })}
        noteMentionCandidates={[]}
        attachments={[]}
        titleFontClassName="font-serif"
        bodyFontClassName="font-sans"
      />,
    );

    // Assert — a carried-over title would save into the wrong note
    expect(titleField().value).toBe('Second');
    expect(resetSticky).toHaveBeenCalled();
  });
});

describe('NoteEditor body', () => {
  it('binds the body to the note’s Yjs doc once it has synced', () => {
    // Arrange|Act
    renderEditor();

    // Assert
    expect(tiptapProps.current?.ydoc).toEqual({ doc: true });
    expect(tiptapProps.current?.canSeed).toBe(true);
    expect(tiptapProps.current?.noteId).toBe('note-1');
  });

  it('saves the body once typing settles', async () => {
    // Arrange
    renderEditor();
    const next = {
      type: 'doc',
      content: [{ type: 'paragraph' }, { type: 'paragraph' }],
    };

    // Act
    act(() => {
      (tiptapProps.current?.onUpdate as (c: unknown) => void)(next);
    });
    await act(async () => {
      vi.advanceTimersByTime(800);
      await Promise.resolve();
    });

    // Assert
    await waitFor(() => {
      expect(patchNote).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ fields: { content: next } }),
      );
    });
  });

  it('skips the write when the body came back unchanged', async () => {
    // Arrange
    renderEditor();

    // Act
    act(() => {
      (tiptapProps.current?.onUpdate as (c: unknown) => void)({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      });
    });
    await act(async () => {
      vi.advanceTimersByTime(800);
      await Promise.resolve();
    });

    // Assert
    expect(patchNote).not.toHaveBeenCalled();
  });

  it('opens the lightbox when the body asks to preview an image', () => {
    // Arrange
    renderEditor();

    // Act
    act(() => {
      (tiptapProps.current?.onImagePreviewRequest as (r: unknown) => void)({
        src: 'blob:image',
        alt: 'Gate',
        filename: 'gate.png',
      });
    });

    // Assert
    expect(screen.getByAltText('Gate')).toBeTruthy();
  });
});

describe('NoteEditor chrome', () => {
  it('lets an entitled reader share the note', () => {
    // Arrange|Act
    renderEditor();

    // Assert
    expect(
      screen.getByRole('button', { name: 'Share' }).hasAttribute('disabled'),
    ).toBe(false);
  });

  it('withholds sharing from a reader without Madrid Pro', () => {
    // Arrange
    meta.current = { notaProEntitled: false };

    // Act
    renderEditor();

    // Assert
    expect(
      screen.getByRole('button', { name: 'Share' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('leaves the body on the legacy content path without entitlement', () => {
    // Arrange
    meta.current = { notaProEntitled: false };

    // Act
    renderEditor();

    // Assert — the mocked hook still returns a doc, so assert what is passed on
    expect(tiptapProps.current?.proEntitled).toBe(false);
  });

  it('persists a layout change against the note', async () => {
    // Arrange
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Note layout' }));

    // Act
    fireEvent.change(await screen.findByLabelText('Column width'), {
      target: { value: 'wide' },
    });

    // Assert
    await waitFor(() => {
      expect(patchNote).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          fields: expect.objectContaining({
            editor_settings: expect.objectContaining({ measure: 'wide' }),
          }),
        }),
      );
    });
  });

  it('refuses a banner upload while signed out of storage', async () => {
    // Arrange
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Note layout' }));
    await screen.findByText('Banner image');
    uploadNoteAttachmentFile.mockResolvedValue({ id: 'att-1' });

    // Act
    fireEvent.change(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      {
        target: {
          files: [new File(['x'], 'b.txt', { type: 'text/plain' })],
        },
      },
    );

    // Assert — only images may become a banner
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Banner upload failed.',
    );
    expect(uploadNoteAttachmentFile).not.toHaveBeenCalled();
  });
});
