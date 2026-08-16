import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { NotaLink } from './nota-link';

describe('NotaLink', () => {
  it('serializes skipLinkPreview as data attribute', () => {
    // Arrange
    const editor = new Editor({
      extensions: [
        StarterKit,
        NotaLink.configure({
          autolink: false,
          openOnClick: false,
          defaultProtocol: 'https',
        }),
      ],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'https://example.com',
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: 'https://example.com',
                      skipLinkPreview: true,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    try {
      // Act
      const html = editor.getHTML();

      // Assert
      expect(html).toContain('data-skip-link-preview="true"');
      expect(html).toContain('https://example.com');
    } finally {
      editor.destroy();
    }
  });

  it('defaults skipLinkPreview to false', () => {
    // Arrange
    const editor = new Editor({
      extensions: [
        StarterKit,
        NotaLink.configure({
          autolink: false,
          openOnClick: false,
          defaultProtocol: 'https',
        }),
      ],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'https://example.com',
                marks: [
                  {
                    type: 'link',
                    attrs: { href: 'https://example.com' },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    try {
      // Act
      const html = editor.getHTML();

      // Assert
      expect(html).not.toContain('data-skip-link-preview');
    } finally {
      editor.destroy();
    }
  });
});
