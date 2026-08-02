import { describe, expect, it } from 'vitest';
import { hrefForNote, parseNoteLinkPath } from './parse-note-link-path';

const NOTE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('parseNoteLinkPath', () => {
  it('parses a relative /notes/:uuid path', () => {
    // Arrange
    const href = `/notes/${NOTE_ID}`;

    // Act
    const id = parseNoteLinkPath(href);

    // Assert
    expect(id).toBe(NOTE_ID);
  });

  it('parses an absolute URL with /notes/:uuid pathname', () => {
    // Arrange
    const href = `https://app.example.com/notes/${NOTE_ID}`;

    // Act
    const id = parseNoteLinkPath(href);

    // Assert
    expect(id).toBe(NOTE_ID);
  });

  it('returns null for external URLs', () => {
    // Arrange
    const href = 'https://example.com/page';

    // Act
    const id = parseNoteLinkPath(href);

    // Assert
    expect(id).toBeNull();
  });
});

describe('hrefForNote', () => {
  it('builds the canonical internal path', () => {
    // Act
    const href = hrefForNote(NOTE_ID);

    // Assert
    expect(href).toBe(`/notes/${NOTE_ID}`);
  });
});
