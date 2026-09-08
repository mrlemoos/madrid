import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';

const markNavIntent = vi.fn();
const vault = { current: { notes: [] as Note[] } };
const screenState = {
  current: { kind: 'notes', panel: 'list', noteId: null } as unknown,
};

vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataVault: () => vault.current,
}));
vi.mock('@getmadrid/app-navigation-ui/use-app-navigation-screen', () => ({
  useAppNavigationScreen: () => screenState.current,
}));
vi.mock('@getmadrid/nota-motion-ui/panel-motion', () => ({ markNavIntent }));

const { NoteBacklinksPanel } = await import('./note-backlinks-panel');

// Internal links only parse for real `/notes/<uuid>` paths.
const NOTE_1 = '11111111-1111-4111-8111-111111111111';
const NOTE_2 = '22222222-2222-4222-8222-222222222222';
const NOTE_3 = '33333333-3333-4333-8333-333333333333';

/** A note whose body links to each of `linksTo`. */
function note(id: string, title: string, linksTo: string[] = []): Note {
  return {
    id,
    title,
    content: {
      type: 'doc',
      content: linksTo.map((target) => ({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: target,
            marks: [{ type: 'link', attrs: { href: `/notes/${target}` } }],
          },
        ],
      })),
    },
  } as unknown as Note;
}

beforeEach(() => {
  vi.clearAllMocks();
  screenState.current = { kind: 'notes', panel: 'list', noteId: null };
});

describe('NoteBacklinksPanel', () => {
  it('says so when nothing links here yet', () => {
    // Arrange
    vault.current = { notes: [note(NOTE_1, 'Alone')] };

    // Act
    render(<NoteBacklinksPanel noteId={NOTE_1} />);

    // Assert
    expect(screen.getByText('No other notes link here yet.')).toBeTruthy();
  });

  it('lists the notes that link here', () => {
    // Arrange
    vault.current = {
      notes: [
        note(NOTE_1, 'Target'),
        note(NOTE_2, 'Itinerary', [NOTE_1]),
        note(NOTE_3, 'Unrelated'),
      ],
    };

    // Act
    render(<NoteBacklinksPanel noteId={NOTE_1} />);

    // Assert
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['Itinerary']);
    expect(links[0]?.getAttribute('href')).toContain(NOTE_2);
  });

  it('labels an untitled note rather than showing an empty row', () => {
    // Arrange
    vault.current = {
      notes: [note(NOTE_1, 'Target'), note(NOTE_2, '   ', [NOTE_1])],
    };

    // Act
    render(<NoteBacklinksPanel noteId={NOTE_1} />);

    // Assert
    expect(screen.getByRole('link').textContent).toBe('Untitled Note');
  });

  it('marks the open note as the current page', () => {
    // Arrange
    vault.current = {
      notes: [
        note(NOTE_1, 'Target', [NOTE_2]),
        note(NOTE_2, 'Itinerary', [NOTE_1]),
      ],
    };
    screenState.current = { kind: 'notes', panel: 'note', noteId: NOTE_2 };

    // Act
    render(<NoteBacklinksPanel noteId={NOTE_1} />);

    // Assert
    expect(
      screen
        .getByRole('link', { name: 'Itinerary' })
        .getAttribute('aria-current'),
    ).toBe('page');
  });

  it('flags pointer intent so the panel transition can animate', () => {
    // Arrange
    vault.current = {
      notes: [note(NOTE_1, 'Target'), note(NOTE_2, 'Itinerary', [NOTE_1])],
    };
    render(<NoteBacklinksPanel noteId={NOTE_1} />);

    // Act
    screen.getByRole('link', { name: 'Itinerary' }).click();

    // Assert — keyboard navigation stays instant; only pointer opens animate
    expect(markNavIntent).toHaveBeenCalledWith('pointer');
  });

  it('labels the section for assistive tech', () => {
    // Arrange
    vault.current = { notes: [note(NOTE_1, 'Target')] };

    // Act
    render(<NoteBacklinksPanel noteId={NOTE_1} />);

    // Assert
    expect(screen.getByRole('region', { name: 'Backlinks' })).toBeTruthy();
  });
});
