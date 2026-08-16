import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { NoteAudio } from './note-audio-extension';

describe('NoteAudio', () => {
  it('registers as noteAudio atom with attachment attrs', () => {
    // Arrange
    const editor = new Editor({
      extensions: [StarterKit, NoteAudio],
      content: {
        type: 'doc',
        content: [
          {
            type: 'noteAudio',
            attrs: {
              attachmentId: 'aud-1',
              filename: 'rec.wav',
            },
          },
        ],
      },
    });
    try {
      // Act
      const node = editor.getJSON().content?.[0] as {
        type?: string;
        attrs?: { attachmentId?: string; filename?: string };
      };

      // Assert
      expect(NoteAudio.name).toBe('noteAudio');
      expect(node?.type).toBe('noteAudio');
      expect(node?.attrs?.attachmentId).toBe('aud-1');
      expect(node?.attrs?.filename).toBe('rec.wav');
    } finally {
      editor.destroy();
    }
  });
});
