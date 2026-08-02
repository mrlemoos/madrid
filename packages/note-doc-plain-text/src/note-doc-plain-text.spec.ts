import { describe, expect, it } from 'vitest';
import {
  extractJournalNoteListPreviewFromDocJson,
  extractPlainTextFromDocJson,
} from './note-doc-plain-text';

describe('extractPlainTextFromDocJson', () => {
  it('returns empty string for non-object input', () => {
    // Arrange
    const nullInput = null;
    const undefinedInput = undefined;
    const stringInput = 'x';

    // Act
    const nullResult = extractPlainTextFromDocJson(nullInput);
    const undefinedResult = extractPlainTextFromDocJson(undefinedInput);
    const stringResult = extractPlainTextFromDocJson(stringInput);

    // Assert
    expect(nullResult).toBe('');
    expect(undefinedResult).toBe('');
    expect(stringResult).toBe('');
  });

  it('extracts text from a simple doc', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'world' },
          ],
        },
      ],
    };

    // Act
    const text = extractPlainTextFromDocJson(doc);

    // Assert
    expect(text).toBe('Hello world');
  });

  it('normalises whitespace', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '  a  \n  b  ' }],
        },
      ],
    };

    // Act
    const text = extractPlainTextFromDocJson(doc);

    // Assert
    expect(text).toBe('a b');
  });
});

describe('extractJournalNoteListPreviewFromDocJson', () => {
  it('returns the first paragraph when there are no leading headings', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Only body line here.' }],
        },
      ],
    };

    // Act
    const preview = extractJournalNoteListPreviewFromDocJson(doc);

    // Assert
    expect(preview).toBe('Only body line here.');
  });

  it('concatenates top-level headings before the first paragraph', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Morning' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Walk' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Cold but clear.' }],
        },
      ],
    };

    // Act
    const preview = extractJournalNoteListPreviewFromDocJson(doc);

    // Assert
    expect(preview).toBe('Morning Walk Cold but clear.');
  });

  it('ignores headings after the first paragraph', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'First.' }],
        },
        {
          type: 'heading',
          content: [{ type: 'text', text: 'Later' }],
        },
      ],
    };

    // Act
    const preview = extractJournalNoteListPreviewFromDocJson(doc);

    // Assert
    expect(preview).toBe('First.');
  });

  it('when there is no paragraph, joins top-level headings only', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          content: [{ type: 'text', text: 'A' }],
        },
        { type: 'horizontalRule' },
        {
          type: 'heading',
          content: [{ type: 'text', text: 'B' }],
        },
      ],
    };

    // Act
    const preview = extractJournalNoteListPreviewFromDocJson(doc);

    // Assert
    expect(preview).toBe('A B');
  });
});
