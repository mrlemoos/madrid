import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { SharedNote } from '@getmadrid/data-source/note-share-client';

const shareMocks = vi.hoisted(() => ({
  fetchSharedNote: vi.fn(async (_token: string) => null as SharedNote | null),
  subscribeSharedNote: vi.fn(
    (_token: string, _onUpdate: () => void) => () => undefined,
  ),
}));

vi.mock('@getmadrid/data-source/note-share-client', () => ({
  fetchSharedNote: (token: string) => shareMocks.fetchSharedNote(token),
  subscribeSharedNote: (token: string, onUpdate: () => void) =>
    shareMocks.subscribeSharedNote(token, onUpdate),
}));

// The real editor is browser-only and irrelevant here; the view under test only
// has to hand it the server-provided content.
vi.mock('./shared-note-body', () => ({
  default: () => <div data-testid="shared-note-body" />,
}));

const { SharedNoteView } = await import('./shared-note-view');

function noteFixture(overrides: Partial<SharedNote> = {}): SharedNote {
  return {
    id: 'note-1',
    title: 'Server rendered title',
    content: { type: 'doc', content: [] },
    editorSettings: {},
    authorDisplayName: 'Leonardo',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('SharedNoteView', () => {
  beforeEach(() => {
    shareMocks.fetchSharedNote.mockClear();
    shareMocks.subscribeSharedNote.mockClear();
  });

  it('renders the note handed down by the server without fetching again', () => {
    // Arrange
    const note = noteFixture();

    // Act
    render(
      <SharedNoteView
        token="tok-1"
        initialNote={note}
        initialAttachments={[]}
        loadError={null}
      />,
    );

    // Assert
    expect(screen.getByText('Server rendered title')).toBeTruthy();
    expect(shareMocks.fetchSharedNote).not.toHaveBeenCalled();
  });

  it('shows the not-found copy when the server found no note', () => {
    // Arrange + Act
    render(
      <SharedNoteView
        token="tok-1"
        initialNote={null}
        initialAttachments={[]}
        loadError={null}
      />,
    );

    // Assert
    expect(screen.getByText('Note not found')).toBeTruthy();
  });

  it('surfaces a server-side load failure', () => {
    // Arrange + Act
    render(
      <SharedNoteView
        token="tok-1"
        initialNote={null}
        initialAttachments={[]}
        loadError="Failed to load shared note: boom"
      />,
    );

    // Assert
    expect(screen.getByText('Failed to load shared note: boom')).toBeTruthy();
  });

  it('refetches when the realtime channel broadcasts an edit', async () => {
    // Arrange
    shareMocks.fetchSharedNote.mockResolvedValueOnce(
      noteFixture({ title: 'Edited title' }),
    );
    render(
      <SharedNoteView
        token="tok-1"
        initialNote={noteFixture()}
        loadError={null}
      />,
    );
    const [, onUpdate] = shareMocks.subscribeSharedNote.mock.calls[0] ?? [];

    // Act
    onUpdate?.();

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Edited title')).toBeTruthy();
    });
    expect(shareMocks.fetchSharedNote).toHaveBeenCalledWith('tok-1');
  });

  it('does not subscribe when the URL carried no token', () => {
    // Arrange + Act
    render(
      <SharedNoteView
        token=""
        initialNote={null}
        initialAttachments={[]}
        loadError={null}
      />,
    );

    // Assert
    expect(shareMocks.subscribeSharedNote).not.toHaveBeenCalled();
    expect(screen.getByText('Note not found')).toBeTruthy();
  });
});
