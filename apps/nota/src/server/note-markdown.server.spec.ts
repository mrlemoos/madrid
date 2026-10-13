import { describe, expect, it } from 'vitest';

import {
  markdownToNoteBlocks,
  noteDocToMarkdown,
} from './note-markdown.server';

describe('markdownToNoteBlocks', () => {
  it('maps headings, paragraphs and inline marks to TipTap nodes', () => {
    // Arrange
    const markdown =
      '## Plan\n\nShip **fast** and *calm*, see [docs](https://x.dev) `now`.';

    // Act
    const blocks = markdownToNoteBlocks(markdown);

    // Assert
    expect(blocks).toEqual([
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Plan' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Ship ' },
          { type: 'text', text: 'fast', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'calm', marks: [{ type: 'italic' }] },
          { type: 'text', text: ', see ' },
          {
            type: 'text',
            text: 'docs',
            marks: [{ type: 'link', attrs: { href: 'https://x.dev' } }],
          },
          { type: 'text', text: ' ' },
          { type: 'text', text: 'now', marks: [{ type: 'code' }] },
          { type: 'text', text: '.' },
        ],
      },
    ]);
  });

  it('wraps list item text in paragraphs and keeps ordered list start', () => {
    // Arrange
    const markdown = '3. one\n4. two';

    // Act
    const [list] = markdownToNoteBlocks(markdown);

    // Assert
    expect(list).toEqual({
      type: 'orderedList',
      attrs: { start: 3 },
      content: [
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
          ],
        },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
          ],
        },
      ],
    });
  });

  it('turns GFM checkboxes into a task list', () => {
    // Arrange
    const markdown = '- [ ] buy milk\n- [x] call mum';

    // Act
    const [list] = markdownToNoteBlocks(markdown);

    // Assert
    expect(list).toEqual({
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'buy milk' }],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'call mum' }],
            },
          ],
        },
      ],
    });
  });

  it('keeps a plain bullet list when only some items are tasks', () => {
    // Arrange
    const markdown = '- [ ] task\n- plain';

    // Act
    const [list] = markdownToNoteBlocks(markdown);

    // Assert
    expect(list.type).toBe('bulletList');
  });

  it('keeps the fence language so mermaid renders as a diagram', () => {
    // Arrange
    const markdown = '```mermaid\ngraph TD; A-->B\n```';

    // Act
    const [block] = markdownToNoteBlocks(markdown);

    // Assert
    expect(block).toEqual({
      type: 'codeBlock',
      attrs: { language: 'mermaid' },
      content: [{ type: 'text', text: 'graph TD; A-->B' }],
    });
  });

  it('builds tables with paragraph-wrapped cells', () => {
    // Arrange
    const markdown = '| a | b |\n| --- | --- |\n| 1 |  |';

    // Act
    const [table] = markdownToNoteBlocks(markdown);

    // Assert
    expect(table).toEqual({
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
              ],
            },
            {
              type: 'tableHeader',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'b' }] },
              ],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: '1' }] },
              ],
            },
            { type: 'tableCell', content: [{ type: 'paragraph' }] },
          ],
        },
      ],
    });
  });

  it('treats raw HTML as text, never markup', () => {
    // Arrange
    const markdown = '<script>alert(1)</script>';

    // Act
    const blocks = markdownToNoteBlocks(markdown);

    // Assert
    expect(blocks).toEqual([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '<script>alert(1)</script>' }],
      },
    ]);
  });

  it('drops javascript: links', () => {
    // Arrange
    const markdown = '[x](javascript:alert(1))';

    // Act
    const blocks = markdownToNoteBlocks(markdown);

    // Assert
    expect(JSON.stringify(blocks)).not.toContain('"type":"link"');
  });

  it('returns no blocks for empty input', () => {
    // Arrange|Act|Assert
    expect(markdownToNoteBlocks('  \n')).toEqual([]);
  });
});

describe('noteDocToMarkdown', () => {
  it('round-trips the supported subset', () => {
    // Arrange
    const markdown = [
      '# Title',
      'Some **bold** and [link](https://x.dev).',
      '- a\n- b',
      '```ts\nconst a = 1;\n```',
      '- [ ] todo\n- [x] done',
      '| h1 | h2 |\n| --- | --- |\n| c1 | c2 |',
    ].join('\n\n');

    // Act
    const out = noteDocToMarkdown({
      type: 'doc',
      content: markdownToNoteBlocks(markdown),
    });

    // Assert
    expect(out).toBe(markdown);
  });

  it('renders attachments and link previews as readable placeholders', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: [
        { type: 'notePdf', attrs: { filename: 'lease.pdf' } },
        { type: 'noteAudio', attrs: { filename: 'memo.wav' } },
        { type: 'noteImage', attrs: { filename: 'cat.png' } },
        {
          type: 'linkPreview',
          attrs: { href: 'https://x.dev', title: 'X' },
        },
        { type: 'flightCode' },
      ],
    };

    // Act
    const out = noteDocToMarkdown(doc);

    // Assert
    expect(out).toBe(
      '[PDF: lease.pdf]\n\n[Recording: memo.wav]\n\n[Image: cat.png]\n\n[X](https://x.dev)\n\n[flightCode]',
    );
  });

  it('indents nested list content under its bullet', () => {
    // Arrange
    const doc = {
      type: 'doc',
      content: markdownToNoteBlocks('- parent\n  - child'),
    };

    // Act
    const out = noteDocToMarkdown(doc);

    // Assert
    expect(out).toBe('- parent\n  - child');
  });

  it('returns an empty string for a malformed doc', () => {
    // Arrange|Act|Assert
    expect(noteDocToMarkdown(null)).toBe('');
  });
});
