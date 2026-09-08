import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const user = { current: { id: 'user-1' } as unknown };
const meta = { current: { loading: false } as unknown };

vi.mock('./command-palette', () => ({
  CommandPalette: () => <div data-testid="palette" />,
}));
vi.mock('@getmadrid/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({ user: user.current }),
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useOptionalNotesDataMeta: () => meta.current,
}));

const { SignedInCommandPalette } = await import('./signed-in-command-palette');

beforeEach(() => {
  user.current = { id: 'user-1' };
  meta.current = { loading: false };
});

describe('SignedInCommandPalette', () => {
  it('renders the palette for a signed-in reader with a loaded vault', () => {
    // Arrange|Act
    render(<SignedInCommandPalette />);

    // Assert
    expect(screen.getByTestId('palette')).toBeTruthy();
  });

  it('renders nothing while signed out', () => {
    // Arrange
    user.current = null;

    // Act
    const { container } = render(<SignedInCommandPalette />);

    // Assert
    expect(container.firstElementChild).toBeNull();
  });

  it('waits for the vault rather than opening on an empty list', () => {
    // Arrange
    meta.current = { loading: true };

    // Act
    const { container } = render(<SignedInCommandPalette />);

    // Assert
    expect(container.firstElementChild).toBeNull();
  });

  it('renders nothing outside the notes data provider', () => {
    // Arrange
    meta.current = undefined;

    // Act
    const { container } = render(<SignedInCommandPalette />);

    // Assert
    expect(container.firstElementChild).toBeNull();
  });
});
