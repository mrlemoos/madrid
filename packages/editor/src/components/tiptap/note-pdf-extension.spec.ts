import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { NotePdf, useNotePdfDocContext } from './note-pdf-extension';

describe('NotePdf', () => {
  it('registers as notePdf atom block', () => {
    // Arrange / Act
    const name = NotePdf.name;
    const editor = new Editor({
      extensions: [StarterKit, NotePdf],
      content: {
        type: 'doc',
        content: [
          {
            type: 'notePdf',
            attrs: {
              attachmentId: 'att-1',
              filename: 'doc.pdf',
            },
          },
        ],
      },
    });
    try {
      // Assert
      expect(name).toBe('notePdf');
      const node = editor.getJSON().content?.[0] as {
        type?: string;
        attrs?: { attachmentId?: string; filename?: string };
      };
      expect(node?.type).toBe('notePdf');
      expect(node?.attrs?.attachmentId).toBe('att-1');
      expect(node?.attrs?.filename).toBe('doc.pdf');
    } finally {
      editor.destroy();
    }
  });

  it('exports useNotePdfDocContext', () => {
    // Arrange / Act / Assert
    expect(typeof useNotePdfDocContext).toBe('function');
  });
});
