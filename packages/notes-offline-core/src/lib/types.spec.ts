import { describe, expect, it } from 'vitest';

import { DEFAULT_NOTE_CONTENT } from './types';

describe('DEFAULT_NOTE_CONTENT', () => {
  it('is an empty but valid ProseMirror document', () => {
    // Arrange|Act|Assert — TipTap refuses a doc with no block child
    expect(DEFAULT_NOTE_CONTENT).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
  });

  it('survives the jsonb round trip unchanged', () => {
    // Arrange|Act
    const roundTripped: unknown = JSON.parse(
      JSON.stringify(DEFAULT_NOTE_CONTENT),
    );

    // Assert
    expect(roundTripped).toEqual(DEFAULT_NOTE_CONTENT);
  });
});
