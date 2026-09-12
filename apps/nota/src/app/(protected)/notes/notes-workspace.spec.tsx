import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@getmadrid/notes-chrome-ui/notes-chrome', () => ({
  NotesChrome: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  NotesDataProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('@getmadrid/electron-bridge-ui/use-is-electron', () => ({
  useIsElectron: () => false,
}));
vi.mock('@getmadrid/electron-bridge-ui/window-drag-band', () => ({
  ElectronWindowDragBand: () => null,
}));
vi.mock('@getmadrid/note-palette-ui/signed-in-command-palette', () => ({
  SignedInCommandPalette: () => null,
}));
vi.mock('@getmadrid/app-navigation-core/navigation', () => ({
  bootstrapAppNavigation: vi.fn(),
  navigateToScreen: vi.fn(),
}));
vi.mock('@getmadrid/app-navigation-core/clerk-hash', () => ({
  repairClerkAuthLocationHash: vi.fn(),
}));
vi.mock('@/lib/nota-server-client', () => ({ fetchNotaProEntitled: vi.fn() }));
vi.mock('@/lib/welcome-note-seed', () => ({
  runWelcomeNoteSeedIfNeeded: vi.fn(),
}));
vi.mock('@getmadrid/data-source/attachment-signed-url-cache', () => ({
  clearNoteAttachmentSignedUrlCache: vi.fn(),
}));

const { NotesWorkspace } = await import('./notes-workspace');

describe('NotesWorkspace', () => {
  it('renders the protected panel', () => {
    // Arrange|Act
    render(<NotesWorkspace>Notes</NotesWorkspace>);

    // Assert
    expect(screen.getByText('Notes')).toBeTruthy();
  });
});
