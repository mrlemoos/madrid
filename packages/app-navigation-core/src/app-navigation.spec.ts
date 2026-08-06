import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  pathForScreen,
  parseAppNavFromLocation,
  replaceScreen,
  navigateToScreen,
} from './app-navigation';
import {
  peekNavIntent,
  resetNavIntent,
} from '@nota/nota-motion-ui/panel-motion';

const SAMPLE_NOTE_ID = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee';

function stubWindowPath(pathname: string): void {
  const prevWindow = globalThis.window;
  vi.stubGlobal('window', {
    ...prevWindow,
    location: {
      ...prevWindow.location,
      pathname,
      hash: '',
      href: `http://localhost:4200${pathname}`,
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetNavIntent();
  document.documentElement.removeAttribute('data-nav-intent');
});

describe('parseAppNavFromLocation', () => {
  it('returns landing when pathname is /', () => {
    // Arrange
    stubWindowPath('/');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'landing' });
  });

  it('returns notFound when pathname is /404', () => {
    // Arrange
    stubWindowPath('/404');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'notFound' });
  });

  it('pathForScreen maps notFound to /404', () => {
    // Arrange
    const screen = { kind: 'notFound' as const };

    // Act
    const href = pathForScreen(screen);

    // Assert
    expect(href).toBe('/404');
  });

  it('pathForScreen maps login to /signin', () => {
    // Arrange
    const screen = { kind: 'login' as const };

    // Act
    const result = pathForScreen(screen);

    // Assert
    expect(result).toBe('/signin');
  });

  it('pathForScreen maps signup to /signup', () => {
    // Arrange
    const screen = { kind: 'signup' as const };

    // Act
    const result = pathForScreen(screen);

    // Assert
    expect(result).toBe('/signup');
  });

  it('pathForScreen maps landing to /', () => {
    // Arrange / Act
    const href = pathForScreen({ kind: 'landing' });

    // Assert
    expect(href).toBe('/');
  });

  it('returns login when pathname is /signin', () => {
    // Arrange
    stubWindowPath('/signin');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'login' });
  });

  it('returns signup when pathname is /signup', () => {
    // Arrange
    stubWindowPath('/signup');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'signup' });
  });

  it('tolerates legacy hyphenated /sign-in', () => {
    // Arrange
    stubWindowPath('/sign-in');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'login' });
  });

  it('returns login for /signin/verify-email-code (Clerk sub-steps)', () => {
    // Arrange
    stubWindowPath('/signin/verify-email-code');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'login' });
  });

  it('returns notes list when pathname is /notes', () => {
    // Arrange
    stubWindowPath('/notes');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'notes', panel: 'list', noteId: null });
  });

  it('returns notes journal when pathname is /notes/journal', () => {
    // Arrange
    stubWindowPath('/notes/journal');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'notes', panel: 'journal', noteId: null });
  });

  it('pathForScreen maps journal to /notes/journal', () => {
    // Arrange
    const screen = {
      kind: 'notes' as const,
      panel: 'journal' as const,
      noteId: null,
    };

    // Act
    const href = pathForScreen(screen);

    // Assert
    expect(href).toBe('/notes/journal');
  });

  it('returns notes graph when pathname is /notes/graph', () => {
    // Arrange
    stubWindowPath('/notes/graph');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'notes', panel: 'graph', noteId: null });
  });

  it('returns note panel for /notes/note/:uuid', () => {
    // Arrange
    stubWindowPath(`/notes/note/${SAMPLE_NOTE_ID}`);

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({
      kind: 'notes',
      panel: 'note',
      noteId: SAMPLE_NOTE_ID,
    });
  });

  it('returns note panel for legacy /notes/:uuid', () => {
    // Arrange
    stubWindowPath(`/notes/${SAMPLE_NOTE_ID}`);

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({
      kind: 'notes',
      panel: 'note',
      noteId: SAMPLE_NOTE_ID,
    });
  });

  it('pathForScreen maps note panel to /notes/note/:uuid', () => {
    // Arrange
    const screen = {
      kind: 'notes' as const,
      panel: 'note' as const,
      noteId: SAMPLE_NOTE_ID,
    };

    // Act
    const href = pathForScreen(screen);

    // Assert
    expect(href).toBe(`/notes/note/${SAMPLE_NOTE_ID}`);
  });

  it('returns notFound when pathname is /typo', () => {
    // Arrange
    stubWindowPath('/typo');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'notFound' });
  });

  it('returns notFound when pathname is /notes/nope', () => {
    // Arrange
    stubWindowPath('/notes/nope');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'notFound' });
  });

  it('returns notFound when note path has invalid uuid', () => {
    // Arrange
    stubWindowPath('/notes/note/not-a-uuid');

    // Act
    const result = parseAppNavFromLocation();

    // Assert
    expect(result).toEqual({ kind: 'notFound' });
  });
});

describe('navigateToScreen / replaceScreen nav intent', () => {
  beforeEach(() => {
    resetNavIntent();
    document.documentElement.removeAttribute('data-nav-intent');
  });

  function stubWindowForWrite(pathname: string): {
    pushState: ReturnType<typeof vi.fn>;
    replaceState: ReturnType<typeof vi.fn>;
  } {
    const prevWindow = globalThis.window;
    const pushState = vi.fn();
    const replaceState = vi.fn();
    vi.stubGlobal('window', {
      ...prevWindow,
      location: {
        ...prevWindow.location,
        pathname,
        hash: '',
        href: `http://localhost:4200${pathname}`,
      },
      history: {
        ...prevWindow.history,
        state: null,
        pushState,
        replaceState,
      },
    });
    return { pushState, replaceState };
  }

  it('defaults to keyboard intent and pushes a new path', () => {
    // Arrange
    const { pushState } = stubWindowForWrite('/notes');

    // Act
    navigateToScreen({ kind: 'notes', panel: 'graph', noteId: null });

    // Assert
    expect(peekNavIntent()).toBe('keyboard');
    expect(document.documentElement.getAttribute('data-nav-intent')).toBe(
      'keyboard',
    );
    expect(pushState).toHaveBeenCalled();
  });

  it('marks pointer intent when options.intent is pointer', () => {
    // Arrange
    stubWindowForWrite('/notes');

    // Act
    navigateToScreen(
      { kind: 'notes', panel: 'journal', noteId: null },
      { intent: 'pointer' },
    );

    // Assert
    expect(peekNavIntent()).toBe('pointer');
    expect(document.documentElement.getAttribute('data-nav-intent')).toBe(
      'pointer',
    );
  });

  it('is a no-op when already on the target path (no duplicate history entry)', () => {
    // Arrange
    const { pushState } = stubWindowForWrite('/notes');

    // Act
    navigateToScreen({ kind: 'notes', panel: 'list', noteId: null });

    // Assert
    expect(pushState).not.toHaveBeenCalled();
  });

  it('marks keyboard intent on replaceScreen by default (paywall redirect)', () => {
    // Arrange
    const { replaceState } = stubWindowForWrite('/notes');

    // Act
    replaceScreen({ kind: 'notes', panel: 'settings', noteId: null });

    // Assert
    expect(peekNavIntent()).toBe('keyboard');
    expect(replaceState).toHaveBeenCalled();
  });
});
