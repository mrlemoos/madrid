import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { stableHandlersRef } = vi.hoisted(() => ({
  stableHandlersRef: { current: null as null },
}));

vi.mock('./tiptap/flight-code-ui', () => ({
  useFlightCode: () => ({
    handlersRef: stableHandlersRef,
    overlay: null,
  }),
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: () => {},
    render: async () => ({ svg: '<svg></svg>', bindFunctions: () => {} }),
  },
}));

import { TipTapEditor } from './tiptap-editor';

const emptyDoc = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
} as const;

describe('TipTapEditor', () => {
  it('renders a ProseMirror editor surface for empty content', () => {
    // Arrange
    const attachments: never[] = [];

    // Act
    const { container } = render(
      <TipTapEditor
        content={emptyDoc}
        noteId="note-1"
        readOnly
        attachments={attachments}
        placeholder="Start writing..."
      />,
    );

    // Assert
    expect(
      container.querySelector('.ProseMirror') ??
        container.querySelector('[contenteditable]'),
    ).toBeTruthy();
  });

  it('applies read-only contenteditable false', () => {
    // Arrange
    const attachments: never[] = [];
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello body' }],
        },
      ],
    };

    // Act
    render(
      <TipTapEditor
        content={content}
        noteId="note-2"
        readOnly
        userId="u1"
        attachments={attachments}
      />,
    );

    // Assert
    const pm = document.querySelector('.ProseMirror');
    expect(pm).toBeTruthy();
    expect(pm?.getAttribute('contenteditable')).toBe('false');
    expect(screen.getByText('Hello body')).toBeTruthy();
  });
});
