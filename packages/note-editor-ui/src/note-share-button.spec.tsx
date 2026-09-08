import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const shareNote = vi.fn();
const writeText = vi.fn().mockResolvedValue(undefined);

vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  getBrowserClient: () => ({ client: 'browser' }),
}));
vi.mock('@getmadrid/data-source/note-share-client', () => ({
  shareNote,
  buildShareUrl: (token: string) => `https://app.getmadrid.app/s/${token}`,
}));

const { NoteShareButton } = await import('./note-share-button');

function openPopover() {
  fireEvent.click(screen.getByRole('button', { name: /Share|Shared/ }));
}

beforeEach(() => {
  vi.clearAllMocks();
  shareNote.mockResolvedValue({
    token: 'tok-1',
    url: 'https://app.getmadrid.app/s/tok-1',
  });
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NoteShareButton', () => {
  it('offers to share a note that has no link yet', () => {
    // Arrange|Act
    render(<NoteShareButton noteId="note-1" shareToken={null} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
  });

  it('reads as already shared when the note carries a token', () => {
    // Arrange|Act
    render(<NoteShareButton noteId="note-1" shareToken="tok-existing" />);

    // Assert
    expect(screen.getByRole('button', { name: 'Shared' })).toBeTruthy();
  });

  it('mints a link, copies it, and tells the editor', async () => {
    // Arrange
    const onShared = vi.fn();
    render(
      <NoteShareButton noteId="note-1" shareToken={null} onShared={onShared} />,
    );
    openPopover();

    // Act
    fireEvent.click(await screen.findByRole('button', { name: 'Create link' }));

    // Assert
    await waitFor(() => {
      expect(onShared).toHaveBeenCalledWith('tok-1');
    });
    expect(shareNote).toHaveBeenCalledWith(
      { client: 'browser' },
      'note-1',
      null,
    );
    expect(writeText).toHaveBeenCalledWith('https://app.getmadrid.app/s/tok-1');
  });

  it('shows the existing link instead of offering to create another', async () => {
    // Arrange
    render(<NoteShareButton noteId="note-1" shareToken="tok-existing" />);

    // Act
    openPopover();

    // Assert
    const field = await screen.findByDisplayValue(
      'https://app.getmadrid.app/s/tok-existing',
    );
    expect(field.hasAttribute('readonly')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Create link' })).toBeNull();
  });

  it('confirms the copy, then goes back to the idle label', async () => {
    // Arrange
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<NoteShareButton noteId="note-1" shareToken="tok-existing" />);
    openPopover();

    // Act
    fireEvent.click(await screen.findByRole('button', { name: 'Copy link' }));

    // Assert
    expect(
      await screen.findByRole('button', { name: 'Link copied' }),
    ).toBeTruthy();
    vi.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copy link' })).toBeTruthy();
    });
    vi.useRealTimers();
  });

  it('says when the clipboard refused', async () => {
    // Arrange
    writeText.mockRejectedValue(new Error('denied'));
    render(<NoteShareButton noteId="note-1" shareToken="tok-existing" />);
    openPopover();

    // Act
    fireEvent.click(await screen.findByRole('button', { name: 'Copy link' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Could not copy link. Try again.',
    );
  });

  it('says when the share itself failed', async () => {
    // Arrange
    shareNote.mockRejectedValue(new Error('row-level security'));
    render(<NoteShareButton noteId="note-1" shareToken={null} />);
    openPopover();

    // Act
    fireEvent.click(await screen.findByRole('button', { name: 'Create link' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Could not share link. Try again.',
    );
  });

  it('follows the note when the editor switches to another one', () => {
    // Arrange
    const { rerender } = render(
      <NoteShareButton noteId="note-1" shareToken="tok-1" />,
    );

    // Act
    rerender(<NoteShareButton noteId="note-2" shareToken={null} />);

    // Assert — a stale token would offer another note's link
    expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
  });

  it('cannot be used while sharing is unavailable', () => {
    // Arrange|Act
    render(<NoteShareButton noteId="note-1" shareToken={null} disabled />);

    // Assert
    expect(
      screen.getByRole('button', { name: 'Share' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});
