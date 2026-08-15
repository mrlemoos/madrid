import { describe, expect, it } from 'vitest';

import {
  buildSharedNoteMeta,
  SHARED_NOTE_UNAVAILABLE_META,
} from './note-share-og';

/** Minimal TipTap doc with one paragraph per string. */
function docOf(...paragraphs: string[]): unknown {
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  };
}

describe('buildSharedNoteMeta', () => {
  it('truncates a long body at a word boundary within 160 characters', () => {
    // Arrange
    const body = 'alpha bravo charlie delta echo foxtrot golf hotel '.repeat(
      10,
    );

    // Act
    const meta = buildSharedNoteMeta({ title: 'Long', content: docOf(body) });

    // Assert
    expect(meta.description).toBeDefined();
    expect(meta.description?.length).toBeLessThanOrEqual(161); // 160 + ellipsis
    expect(meta.description?.endsWith('…')).toBe(true);
    expect(meta.description).not.toMatch(/\s…$/);
    expect(body.startsWith(meta.description?.slice(0, -1) ?? '')).toBe(true);
  });

  it('passes a short body through whole, with blocks space-separated', () => {
    // Arrange
    const content = docOf('First block.', 'Second block.');

    // Act
    const meta = buildSharedNoteMeta({ title: 'Short', content });

    // Assert
    expect(meta.description).toBe('First block. Second block.');
  });

  it('omits the description when the body has no text', () => {
    // Arrange
    const content = { type: 'doc', content: [{ type: 'paragraph' }] };

    // Act
    const meta = buildSharedNoteMeta({ title: 'Empty', content });

    // Assert
    expect(meta).toEqual({ title: 'Empty' });
    expect('description' in meta).toBe(false);
  });

  it('falls back to the untitled label for a blank title', () => {
    // Arrange
    const content = docOf('Body.');

    // Act
    const meta = buildSharedNoteMeta({ title: '   ', content });

    // Assert
    expect(meta.title).toBe('Untitled Note');
  });

  it('returns the unavailable fallback for a missing note', () => {
    // Arrange
    const note = null;

    // Act
    const meta = buildSharedNoteMeta(note);

    // Assert
    expect(meta).toEqual(SHARED_NOTE_UNAVAILABLE_META);
    expect(meta.title).toBe('Nota');
  });
});
