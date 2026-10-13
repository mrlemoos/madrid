import { NOTA_YDOC_FIELD } from '@getmadrid/notes-yjs-core';
import { yXmlFragmentToProsemirrorJSON } from 'y-prosemirror';
import * as Y from 'yjs';
import { describe, expect, it } from 'vitest';

import { markdownToNoteBlocks } from './note-markdown.server';
import { appendBlocksToYjsLog } from './note-yjs-append.server';

function existingLog(text: string): Uint8Array[] {
  const doc = new Y.Doc();
  const para = new Y.XmlElement('paragraph');
  para.insert(0, [new Y.XmlText(text)]);
  doc.getXmlFragment(NOTA_YDOC_FIELD).insert(0, [para]);
  return [Y.encodeStateAsUpdate(doc)];
}

function bodyJson(updates: Uint8Array[]): unknown {
  const doc = new Y.Doc();
  for (const u of updates) Y.applyUpdate(doc, u);
  return yXmlFragmentToProsemirrorJSON(doc.getXmlFragment(NOTA_YDOC_FIELD));
}

describe('appendBlocksToYjsLog', () => {
  it('appends blocks after the existing body as y-prosemirror reads them', () => {
    // Arrange
    const log = existingLog('kept');
    const blocks = markdownToNoteBlocks('## New\n\n- [x] **done**');

    // Act
    const delta = appendBlocksToYjsLog(log, blocks);

    // Assert
    expect(bodyJson([...log, delta])).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'kept' }] },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'New' }],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'done',
                      marks: [{ type: 'bold', attrs: {} }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('returns only the new delta, not the whole stored log', () => {
    // Arrange
    const log = existingLog('x'.repeat(5_000));

    // Act
    const delta = appendBlocksToYjsLog(log, markdownToNoteBlocks('hi'));

    // Assert
    expect(delta.byteLength).toBeLessThan(200);
  });

  it('merges with an edit a client made concurrently', () => {
    // Arrange
    const log = existingLog('base');
    const client = new Y.Doc();
    Y.applyUpdate(client, log[0]);
    const clientBefore = Y.encodeStateVector(client);
    const typed = new Y.XmlElement('paragraph');
    typed.insert(0, [new Y.XmlText('typed')]);
    client.getXmlFragment(NOTA_YDOC_FIELD).insert(1, [typed]);
    const clientEdit = Y.encodeStateAsUpdate(client, clientBefore);

    // Act
    const delta = appendBlocksToYjsLog(log, markdownToNoteBlocks('agent'));

    // Assert
    const texts = JSON.stringify(bodyJson([...log, clientEdit, delta]));
    expect(texts).toContain('"base"');
    expect(texts).toContain('"typed"');
    expect(texts).toContain('"agent"');
  });
});
