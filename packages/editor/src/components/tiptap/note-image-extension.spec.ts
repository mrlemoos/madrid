import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { NoteImage } from './note-image-extension';

describe('NoteImage', () => {
  it('registers as noteImage with align attribute', () => {
    // Arrange
    const editor = new Editor({
      extensions: [StarterKit, NoteImage],
      content: {
        type: 'doc',
        content: [
          {
            type: 'noteImage',
            attrs: {
              attachmentId: 'img-1',
              filename: 'photo.png',
              align: 'center',
            },
          },
        ],
      },
    });
    try {
      // Act
      const node = editor.getJSON().content?.[0] as {
        type?: string;
        attrs?: { align?: string; attachmentId?: string };
      };

      // Assert
      expect(NoteImage.name).toBe('noteImage');
      expect(node?.type).toBe('noteImage');
      expect(node?.attrs?.align).toBe('center');
      expect(node?.attrs?.attachmentId).toBe('img-1');
    } finally {
      editor.destroy();
    }
  });

  it('defaults align to left', () => {
    // Arrange
    const editor = new Editor({
      extensions: [StarterKit, NoteImage],
      content: {
        type: 'doc',
        content: [
          {
            type: 'noteImage',
            attrs: { attachmentId: 'img-2', filename: 'a.png' },
          },
        ],
      },
    });
    try {
      // Act
      const node = editor.getJSON().content?.[0] as {
        attrs?: { align?: string };
      };

      // Assert
      expect(node?.attrs?.align).toBe('left');
    } finally {
      editor.destroy();
    }
  });
});
