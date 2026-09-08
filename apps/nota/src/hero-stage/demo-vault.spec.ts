import { describe, expect, it } from 'vitest';
import { parseNoteLinkPath } from '@getmadrid/internal-note-link';
import { buildNoteLinkGraph } from '@getmadrid/note-link-graph';

import {
  DEMO_FOLDERS,
  DEMO_NOTES,
  DEMO_PREFERENCES,
  MENTION_CANDIDATES,
  NOTE_IDS,
  OPEN_NOTE_TITLE,
} from './demo-vault';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('demo vault ids', () => {
  it('keeps every id a well-formed UUID, so internal links parse', () => {
    // Arrange
    const ids = [...Object.values(NOTE_IDS), ...DEMO_FOLDERS.map((f) => f.id)];

    // Act|Assert
    for (const id of ids) {
      expect(id).toMatch(UUID);
      expect(parseNoteLinkPath(`/notes/${id}`)).toBe(id);
    }
  });

  it('keeps the ids fixed so a re-recording lays the graph out the same', () => {
    // Arrange|Act|Assert
    expect(NOTE_IDS.commonplace).toBe('5ca1ab1e-0000-4000-8000-000000000001');
    expect(new Set(Object.values(NOTE_IDS)).size).toBe(
      Object.keys(NOTE_IDS).length,
    );
  });
});

describe('demo vault notes', () => {
  it('opens on the note the recording expects', () => {
    // Arrange|Act
    const open = DEMO_NOTES.find((n) => n.id === NOTE_IDS.commonplace);

    // Assert
    expect(open?.title).toBe(OPEN_NOTE_TITLE);
  });

  it('gives every note an id from the fixed set', () => {
    // Arrange
    const known = new Set<string>(Object.values(NOTE_IDS));

    // Act|Assert
    for (const note of DEMO_NOTES) {
      expect(known.has(note.id)).toBe(true);
    }
  });

  it('links notes together so the graph has something to draw', () => {
    // Arrange|Act
    const { outgoing } = buildNoteLinkGraph(DEMO_NOTES);

    // Assert
    const edges = [...outgoing.values()].reduce((n, set) => n + set.size, 0);
    expect(edges).toBeGreaterThan(0);
  });

  it('files notes only into folders that exist', () => {
    // Arrange
    const folderIds = new Set(DEMO_FOLDERS.map((f) => f.id));

    // Act|Assert
    for (const note of DEMO_NOTES) {
      if (note.folder_id !== null) {
        expect(folderIds.has(note.folder_id)).toBe(true);
      }
    }
  });

  it('touches no real account', () => {
    // Arrange|Act|Assert — nothing from a real vault may appear on camera
    for (const note of DEMO_NOTES) {
      expect(note.user_id).toBe('hero-stage');
    }
    expect(DEMO_PREFERENCES.user_id).toBe('hero-stage');
  });
});

describe('MENTION_CANDIDATES', () => {
  it('offers every note but the one already open', () => {
    // Arrange|Act|Assert — a note cannot usefully mention itself
    expect(MENTION_CANDIDATES).toHaveLength(DEMO_NOTES.length - 1);
    expect(MENTION_CANDIDATES.some((n) => n.id === NOTE_IDS.commonplace)).toBe(
      false,
    );
  });
});

describe('DEMO_PREFERENCES', () => {
  it('quietens the chrome that would clutter the recording', () => {
    // Arrange|Act|Assert
    expect(DEMO_PREFERENCES.welcome_seeded).toBe(true);
    expect(DEMO_PREFERENCES.show_writing_activity_graph).toBe(false);
    expect(DEMO_PREFERENCES.locale).toBe('en-GB');
  });
});
