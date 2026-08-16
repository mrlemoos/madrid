import { Editor, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { describe, expect, it } from 'vitest';
import { NotaCodeBlock } from './nota-code-block';
import { NotaLink } from './nota-link';
import {
  convertLinkOnlyParagraphs,
  revertLinkPreviewToParagraph,
} from './link-preview-scan';

/** Minimal `linkPreview` node — avoids React node views from the real extension. */
const LinkPreviewTestNode = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      href: { default: '' },
      linkText: { default: '' },
      title: { default: '' },
      description: { default: '' },
      image: { default: '' },
      platformKind: { default: '' },
      platformLogo: { default: '' },
      platformBold: { default: '' },
      platformPrefix: { default: '' },
      platformSuffix: { default: '' },
      platformDisplayText: { default: '' },
      platformThumbnailUrl: { default: '' },
      platformChannelName: { default: '' },
      platformChannelAvatarUrl: { default: '' },
      platformSubreddit: { default: '' },
      platformSubredditAvatarUrl: { default: '' },
      platformPostTitle: { default: '' },
      platformOp: { default: '' },
      platformUserAvatarUrl: { default: '' },
      platformExtract: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-link-preview]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-link-preview': '' }, HTMLAttributes),
    ];
  },
});

function linkOnlyParagraphJson(text: string, href: string) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text,
            marks: [{ type: 'link', attrs: { href } }],
          },
        ],
      },
    ],
  } as const;
}

function collectTypes(node: unknown): string[] {
  if (!node || typeof node !== 'object') {
    return [];
  }
  const n = node as { type?: string; content?: unknown[] };
  const self = n.type ? [n.type] : [];
  const children = (n.content ?? []).flatMap(collectTypes);
  return [...self, ...children];
}

function createEditor(content: unknown) {
  return new Editor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      NotaCodeBlock,
      TaskList.configure({
        HTMLAttributes: { class: 'nota-task-list' },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'nota-task-item' },
      }),
      NotaLink.configure({
        autolink: true,
        openOnClick: false,
        defaultProtocol: 'https',
      }),
      LinkPreviewTestNode,
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'nota-table' },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
  });
}

describe('convertLinkOnlyParagraphs', () => {
  it('promotes a top-level link-only paragraph when anchor text equals href', () => {
    // Arrange
    const url = 'https://example.com/page';
    const editor = createEditor(linkOnlyParagraphJson(url, url));

    // Act
    convertLinkOnlyParagraphs(editor);

    // Assert
    expect(collectTypes(editor.getJSON())).toContain('linkPreview');
    editor.destroy();
  });

  it('does not promote when anchor text differs from href', () => {
    // Arrange
    const editor = createEditor(
      linkOnlyParagraphJson('read more', 'https://example.com'),
    );

    // Act
    convertLinkOnlyParagraphs(editor);

    // Assert
    expect(collectTypes(editor.getJSON())).not.toContain('linkPreview');
    expect(
      collectTypes(editor.getJSON()).filter((t) => t === 'paragraph').length,
    ).toBe(1);
    editor.destroy();
  });

  it('does not promote when matching URL is inside a bullet list item', () => {
    // Arrange
    const url = 'https://example.com/a';
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: url,
                      marks: [{ type: 'link', attrs: { href: url } }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    // Act
    convertLinkOnlyParagraphs(editor);

    // Assert
    expect(collectTypes(editor.getJSON())).not.toContain('linkPreview');
    editor.destroy();
  });

  it('does not promote when matching URL is inside a task item', () => {
    // Arrange
    const url = 'https://example.com/task';
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: url,
                      marks: [{ type: 'link', attrs: { href: url } }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    // Act
    convertLinkOnlyParagraphs(editor);

    // Assert
    expect(collectTypes(editor.getJSON())).not.toContain('linkPreview');
    editor.destroy();
  });

  it('promotes when matching URL is inside a table cell', () => {
    // Arrange
    const url = 'https://example.com/table';
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: url,
                          marks: [{ type: 'link', attrs: { href: url } }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    // Act
    convertLinkOnlyParagraphs(editor);

    // Assert
    expect(collectTypes(editor.getJSON())).toContain('linkPreview');
    editor.destroy();
  });
});

describe('revertLinkPreviewToParagraph', () => {
  it('replaces linkPreview with a skipLinkPreview paragraph', () => {
    // Arrange
    const url = 'https://example.com/page';
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'linkPreview',
          attrs: {
            href: url,
            linkText: url,
            title: '',
            description: '',
            image: '',
          },
        },
      ],
    });
    try {
      let previewPos = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'linkPreview') {
          previewPos = pos;
          return false;
        }
        return true;
      });

      // Act
      const ok = revertLinkPreviewToParagraph(editor, () => previewPos);

      // Assert
      expect(ok).toBe(true);
      expect(collectTypes(editor.getJSON())).not.toContain('linkPreview');
      expect(collectTypes(editor.getJSON())).toContain('paragraph');
      const html = editor.getHTML();
      expect(html).toContain(url);
      expect(html).toContain('data-skip-link-preview');
    } finally {
      editor.destroy();
    }
  });

  it('returns false when getPos is undefined', () => {
    // Arrange
    const editor = createEditor('<p>x</p>');
    try {
      // Act
      const ok = revertLinkPreviewToParagraph(editor, () => undefined);

      // Assert
      expect(ok).toBe(false);
    } finally {
      editor.destroy();
    }
  });
});
