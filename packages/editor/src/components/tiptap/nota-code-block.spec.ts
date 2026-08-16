import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { NotaCodeBlock } from './nota-code-block';

describe('NotaCodeBlock', () => {
  it('is named codeBlock and accepts mermaid language', () => {
    // Arrange
    const editor = new Editor({
      extensions: [StarterKit.configure({ codeBlock: false }), NotaCodeBlock],
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
          },
        ],
      },
    });
    try {
      // Act
      const json = editor.getJSON();
      const block = json.content?.[0] as {
        type?: string;
        attrs?: { language?: string };
      };

      // Assert
      expect(NotaCodeBlock.name).toBe('codeBlock');
      expect(block?.type).toBe('codeBlock');
      expect(block?.attrs?.language).toBe('mermaid');
    } finally {
      editor.destroy();
    }
  });
});
