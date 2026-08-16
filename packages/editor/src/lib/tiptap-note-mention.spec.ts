import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { NotaLink } from '../components/tiptap/nota-link';
import { findNoteMentionTrigger } from './tiptap-note-mention';

function createEditor(content: string) {
  return new Editor({
    extensions: [
      StarterKit,
      NotaLink.configure({
        autolink: false,
        linkOnPaste: false,
        openOnClick: false,
        defaultProtocol: 'https',
      }),
    ],
    content,
  });
}

describe('findNoteMentionTrigger', () => {
  it('returns trigger when cursor is after @query', () => {
    // Arrange
    const editor = createEditor('<p>Hello @me</p>');
    try {
      editor.commands.setTextSelection(editor.state.doc.content.size - 1);

      // Act
      const trigger = findNoteMentionTrigger(editor.state);

      // Assert
      expect(trigger).not.toBeNull();
      expect(trigger?.query).toBe('me');
    } finally {
      editor.destroy();
    }
  });

  it('returns null when there is no @ mention', () => {
    // Arrange
    const editor = createEditor('<p>no mention</p>');
    try {
      editor.commands.setTextSelection(editor.state.doc.content.size - 1);

      // Act
      const trigger = findNoteMentionTrigger(editor.state);

      // Assert
      expect(trigger).toBeNull();
    } finally {
      editor.destroy();
    }
  });

  it('returns null inside a code block', () => {
    // Arrange
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          content: [{ type: 'text', text: '@me' }],
        },
      ],
    } as never);
    try {
      editor.commands.setTextSelection(editor.state.doc.content.size - 1);

      // Act
      const trigger = findNoteMentionTrigger(editor.state);

      // Assert
      expect(trigger).toBeNull();
    } finally {
      editor.destroy();
    }
  });

  it('returns empty query right after bare @', () => {
    // Arrange
    const editor = createEditor('<p>@</p>');
    try {
      editor.commands.setTextSelection(editor.state.doc.content.size - 1);

      // Act
      const trigger = findNoteMentionTrigger(editor.state);

      // Assert
      expect(trigger).not.toBeNull();
      expect(trigger?.query).toBe('');
    } finally {
      editor.destroy();
    }
  });
});
