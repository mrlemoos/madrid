import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { LinkPreview } from './link-preview-extension';

describe('LinkPreview', () => {
  it('registers as linkPreview with href and platform attrs', () => {
    // Arrange
    const editor = new Editor({
      extensions: [StarterKit, LinkPreview],
      content: {
        type: 'doc',
        content: [
          {
            type: 'linkPreview',
            attrs: {
              href: 'https://example.com',
              linkText: 'https://example.com',
              title: 'Example',
              description: 'Desc',
              image: '',
              platformKind: '',
              platformLogo: '',
            },
          },
        ],
      },
    });
    try {
      // Act
      const node = editor.getJSON().content?.[0] as {
        type?: string;
        attrs?: { href?: string; title?: string };
      };

      // Assert
      expect(LinkPreview.name).toBe('linkPreview');
      expect(node?.type).toBe('linkPreview');
      expect(node?.attrs?.href).toBe('https://example.com');
      expect(node?.attrs?.title).toBe('Example');
    } finally {
      editor.destroy();
    }
  });
});
