import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TableEditorMenu } from './table-editor-menu';

vi.mock('@tiptap/react', async () => {
  const actual =
    await vi.importActual<typeof import('@tiptap/react')>('@tiptap/react');
  return {
    ...actual,
    BubbleMenu: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="bubble-menu">{children}</div>
    ),
  };
});

describe('TableEditorMenu', () => {
  it('renders nothing when editor is null', () => {
    // Arrange / Act
    const { container } = render(<TableEditorMenu editor={null} />);

    // Assert
    expect(container.innerHTML).toBe('');
  });

  it('renders table toolbar actions when editor is provided', () => {
    // Arrange
    const chain = {
      addRowBefore: () => chain,
      addRowAfter: () => chain,
      deleteRow: () => chain,
      addColumnBefore: () => chain,
      addColumnAfter: () => chain,
      deleteColumn: () => chain,
      toggleHeaderRow: () => chain,
      toggleHeaderColumn: () => chain,
      deleteTable: () => chain,
      focus: () => chain,
      run: () => true,
    };
    const editor = {
      chain: () => chain,
      isActive: () => true,
    } as never;

    // Act
    render(<TableEditorMenu editor={editor} />);

    // Assert
    expect(screen.getByRole('toolbar', { name: 'Table' })).toBeTruthy();
    expect(screen.getByLabelText('Add row above')).toBeTruthy();
    expect(screen.getByLabelText('Delete table')).toBeTruthy();
  });
});
