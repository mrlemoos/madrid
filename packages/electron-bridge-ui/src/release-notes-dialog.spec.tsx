import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const grab = vi.fn();

vi.mock('@getmadrid/data-source/app-api-grab', () => ({
  appApiGrab: () => grab,
}));

const { ReleaseNotesDialog } = await import('./release-notes-dialog');

function release(overrides: Record<string, unknown> = {}) {
  return {
    tagName: 'v1.2.0',
    title: 'Quieter sync',
    url: 'https://github.com/mrlemoos/madrid/releases/tag/v1.2.0',
    notes: 'Fixes the sidebar flash.',
    publishedAt: '2026-03-04T10:00:00.000Z',
    prerelease: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  grab.mockResolvedValue([{ releases: [release()] }, null]);
});

describe('ReleaseNotesDialog', () => {
  it('fetches nothing until it is opened', () => {
    // Arrange|Act
    render(<ReleaseNotesDialog open={false} onOpenChange={vi.fn()} />);

    // Assert
    expect(grab).not.toHaveBeenCalled();
  });

  it('asks for the last five releases when opened', () => {
    // Arrange|Act
    render(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect(grab).toHaveBeenCalledWith('GET /api/releases?limit=5');
  });

  it('shows a release with its tag, notes and date', async () => {
    // Arrange|Act
    render(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect(await screen.findByText('Quieter sync')).toBeTruthy();
    expect(screen.getByText('v1.2.0')).toBeTruthy();
    expect(screen.getByText('Fixes the sidebar flash.')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Open on GitHub' }).getAttribute('href'),
    ).toBe('https://github.com/mrlemoos/madrid/releases/tag/v1.2.0');
  });

  it('marks a prerelease', async () => {
    // Arrange
    grab.mockResolvedValue([
      { releases: [release({ prerelease: true })] },
      null,
    ]);

    // Act
    render(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect(await screen.findByText('RC')).toBeTruthy();
  });

  it('says so for a release with no notes', async () => {
    // Arrange
    grab.mockResolvedValue([{ releases: [release({ notes: '' })] }, null]);

    // Act
    render(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect(await screen.findByText('No release notes.')).toBeTruthy();
  });

  it('omits the date when the release has none it can read', async () => {
    // Arrange
    grab.mockResolvedValue([
      { releases: [release({ publishedAt: 'not-a-date' })] },
      null,
    ]);

    // Act
    render(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect(await screen.findByText('Quieter sync')).toBeTruthy();
    expect(screen.queryByText(/Invalid Date/)).toBeNull();
  });

  it('says when there are no releases at all', async () => {
    // Arrange
    grab.mockResolvedValue([{ releases: [] }, null]);

    // Act
    render(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect(await screen.findByText('No releases yet.')).toBeTruthy();
  });

  it('treats a malformed payload as empty rather than crashing', async () => {
    // Arrange
    grab.mockResolvedValue([{ releases: 'nope' }, null]);

    // Act
    render(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect(await screen.findByText('No releases yet.')).toBeTruthy();
  });

  it('reports a failed fetch', async () => {
    // Arrange
    grab.mockResolvedValue([{}, new Error('offline')]);

    // Act
    render(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Could not load release notes.',
    );
  });

  it('refetches when reopened, so a fixed connection shows the notes', async () => {
    // Arrange
    grab.mockResolvedValue([{}, new Error('offline')]);
    const { rerender } = render(
      <ReleaseNotesDialog open onOpenChange={vi.fn()} />,
    );
    await screen.findByRole('alert');

    // Act
    grab.mockResolvedValue([{ releases: [release()] }, null]);
    rerender(<ReleaseNotesDialog open={false} onOpenChange={vi.fn()} />);
    rerender(<ReleaseNotesDialog open onOpenChange={vi.fn()} />);

    // Assert
    expect(await screen.findByText('Quieter sync')).toBeTruthy();
  });

  it('closes on the Close button', async () => {
    // Arrange
    const onOpenChange = vi.fn();
    render(<ReleaseNotesDialog open onOpenChange={onOpenChange} />);

    // Act
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
