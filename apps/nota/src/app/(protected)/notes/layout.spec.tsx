import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const bootstrapAppNavigation = vi.fn();
const repairClerkAuthLocationHash = vi.fn();
const fetchNotaProEntitled = vi.fn();
const runWelcomeNoteSeedIfNeeded = vi.fn();
const clearNoteAttachmentSignedUrlCache = vi.fn();
const navigateToScreen = vi.fn();
const providerProps = { current: null as Record<string, unknown> | null };

vi.mock('@getmadrid/notes-chrome-ui/notes-chrome', () => ({
  NotesChrome: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chrome">{children}</div>
  ),
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  NotesDataProvider: (props: Record<string, unknown>) => {
    providerProps.current = props;
    return <>{props.children as React.ReactNode}</>;
  },
}));
vi.mock('@getmadrid/electron-bridge-ui/window-drag-band', () => ({
  ElectronWindowDragBand: () => <div data-testid="drag-band" />,
}));
vi.mock('@getmadrid/app-navigation-core/navigation', () => ({
  bootstrapAppNavigation,
  navigateToScreen,
}));
vi.mock('@getmadrid/app-navigation-core/clerk-hash', () => ({
  repairClerkAuthLocationHash,
}));
vi.mock('@/lib/nota-server-client', () => ({ fetchNotaProEntitled }));
vi.mock('@/lib/welcome-note-seed', () => ({ runWelcomeNoteSeedIfNeeded }));
vi.mock('@getmadrid/data-source/attachment-signed-url-cache', () => ({
  clearNoteAttachmentSignedUrlCache,
}));
vi.mock('@getmadrid/note-palette-ui/signed-in-command-palette', () => ({
  SignedInCommandPalette: () => <div data-testid="palette" />,
}));

const { default: NotesLayout } = await import('./layout');

beforeEach(() => {
  vi.clearAllMocks();
  providerProps.current = null;
});

afterEach(() => {
  delete (window as { nota?: unknown }).nota;
});

describe('NotesLayout', () => {
  it('hosts the palette and chrome around the active panel', () => {
    // Arrange|Act
    render(
      <NotesLayout>
        <span>panel</span>
      </NotesLayout>,
    );

    // Assert
    expect(screen.getByTestId('palette')).toBeTruthy();
    expect(screen.getByTestId('chrome')).toBeTruthy();
    expect(screen.getByText('panel')).toBeTruthy();
  });

  it('boots navigation and repairs the Clerk hash once', async () => {
    // Arrange|Act
    const { rerender } = render(<NotesLayout>panel</NotesLayout>);
    rerender(<NotesLayout>panel</NotesLayout>);
    await Promise.resolve();

    // Assert
    expect(bootstrapAppNavigation).toHaveBeenCalledTimes(1);
    expect(repairClerkAuthLocationHash).toHaveBeenCalled();
  });

  it('wires the app-owned ports into the notes runtime', () => {
    // Arrange|Act
    render(<NotesLayout>panel</NotesLayout>);

    // Assert
    expect(providerProps.current?.ports).toMatchObject({
      fetchNotaProEntitled,
      runWelcomeNoteSeedIfNeeded,
      clearNoteAttachmentSignedUrlCache,
    });
  });

  it('keeps the ports identity stable across renders', () => {
    // Arrange
    const { rerender } = render(<NotesLayout>panel</NotesLayout>);
    const first = providerProps.current?.ports;

    // Act
    rerender(<NotesLayout>panel</NotesLayout>);

    // Assert — a new object each render would reset the runtime
    expect(providerProps.current?.ports).toBe(first);
  });

  it('navigates to a note through the runtime port', () => {
    // Arrange
    render(<NotesLayout>panel</NotesLayout>);
    const ports = providerProps.current?.ports as {
      navigateToNote: (id: string) => void;
    };

    // Act
    ports.navigateToNote('note-1');

    // Assert
    expect(navigateToScreen).toHaveBeenCalledWith({
      kind: 'notes',
      panel: 'note',
      noteId: 'note-1',
    });
  });

  it('lets macOS vibrancy through in Electron instead of painting over it', () => {
    // Arrange
    (window as { nota?: unknown }).nota = {};

    // Act
    const { container } = render(<NotesLayout>panel</NotesLayout>);

    // Assert
    expect(container.firstElementChild?.className).toContain('bg-transparent');
  });

  it('paints an opaque background in the browser', () => {
    // Arrange
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Safari/605' });

    // Act
    const { container } = render(<NotesLayout>panel</NotesLayout>);

    // Assert
    expect(container.firstElementChild?.className).toContain('bg-background');
    vi.unstubAllGlobals();
  });
});
