import { describe, expect, it } from 'vitest';

import { extractPlainTextFromDocJson } from './note-plain-text.server';

describe('extractPlainTextFromDocJson', () => {
  it('joins the text across nested blocks', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The quiet ' },
            { type: 'text', text: 'part' },
          ],
        },
        { type: 'paragraph', content: [{ type: 'text', text: ' out loud' }] },
      ],
    };

    // Act|Assert
    expect(extractPlainTextFromDocJson(doc)).toBe('The quiet part out loud');
  });

  it('collapses runs of whitespace and trims the ends', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [{ type: 'text', text: '  spaced \n\n  out  ' }],
    };

    // Act|Assert — the output feeds embeddings and share excerpts
    expect(extractPlainTextFromDocJson(doc)).toBe('spaced out');
  });

  it('names a recording so an audio-only note is not indexed as empty', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [{ type: 'noteAudio', attrs: { attachmentId: 'att-1' } }],
    };

    // Act|Assert
    expect(extractPlainTextFromDocJson(doc)).toBe('Recording');
  });

  it('is empty for a blank document', () => {
    // Arrange|Act|Assert
    expect(
      extractPlainTextFromDocJson({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      }),
    ).toBe('');
  });

  it('returns empty for anything that is not a document', () => {
    // Arrange|Act|Assert
    for (const input of [null, undefined, 'text', 42]) {
      expect(extractPlainTextFromDocJson(input)).toBe('');
    }
  });
});
