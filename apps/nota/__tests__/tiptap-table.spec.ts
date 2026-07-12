import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { describe, expect, it } from 'vitest';
import { NotaCodeBlock } from '@nota/editor';

function collectTypes(node: unknown): string[] {
  if (!node || typeof node !== 'object') {
    return [];
  }
  const n = node as { type?: string; content?: unknown[] };
  const self = n.type ? [n.type] : [];
  const children = (n.content ?? []).flatMap(collectTypes);
  return [...self, ...children];
}

function createEditorWithTable() {
  return new Editor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      NotaCodeBlock,
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'nota-table' },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  });
}

describe('TipTap table', () => {
  it('insertTable produces table and tableCell nodes in JSON', () => {
    // Arrange
    const editor = createEditorWithTable();
    const tableConfig = { rows: 2, cols: 2, withHeaderRow: true };

    // Act
    editor.chain().focus().insertTable(tableConfig).run();
    const types = collectTypes(editor.getJSON());

    // Assert
    expect(types).toContain('table');
    expect(types.filter((t) => t === 'tableCell').length).toBeGreaterThan(0);

    editor.destroy();
  });

  it('insertTable appends a paragraph after the table', () => {
    const editor = createEditorWithTable();

    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .command(({ tr, dispatch }) => {
        let tableEnd = -1;
        tr.doc.forEach((node, offset) => {
          if (node.type.name === 'table') {
            tableEnd = offset + node.nodeSize;
          }
        });
        if (dispatch && tableEnd >= 0 && tableEnd <= tr.doc.content.size) {
          tr.insert(tableEnd, tr.doc.type.schema.nodes.paragraph.create());
        }
        return true;
      })
      .run();

    const content = editor.getJSON().content ?? [];
    expect(content.at(-1)?.type).toBe('paragraph');

    editor.destroy();
  });

  it('round-trips table document JSON through setContent', () => {
    // Arrange
    const editor = createEditorWithTable();
    const tableConfig = { rows: 2, cols: 2, withHeaderRow: false };
    const parseAsHtml = false;
    editor.chain().focus().insertTable(tableConfig).run();
    const snapshot = editor.getJSON();

    // Act
    editor.commands.setContent(snapshot, parseAsHtml);
    const after = collectTypes(editor.getJSON());

    // Assert
    expect(after).toContain('table');
    expect(after.filter((t) => t === 'tableCell').length).toBeGreaterThan(0);

    editor.destroy();
  });
});
