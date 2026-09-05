import type { Note } from '@getmadrid/database-types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NoteLinkMentionMenu } from './note-link-mention-menu';

const sampleNote = {
  id: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
  user_id: 'u1',
  title: 'Alpha',
  content: {},
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2020-01-01T00:00:00Z',
} as Note;

describe('NoteLinkMentionMenu', () => {
  it('renders nothing when closed', () => {
    // Arrange
    const onSelect = vi.fn();

    // Act
    const { container } = render(
      <NoteLinkMentionMenu
        open={false}
        anchor={{ left: 10, top: 20 }}
        notes={[sampleNote]}
        selectedIndex={0}
        onHighlightIndex={() => {}}
        onSelect={onSelect}
        emptyMessage="No notes"
      />,
    );

    // Assert
    expect(container.innerHTML).toBe('');
  });

  it('shows empty message when open with no notes', () => {
    // Arrange
    const emptyMessage = 'No matching notes';

    // Act
    render(
      <NoteLinkMentionMenu
        open
        anchor={{ left: 10, top: 20 }}
        notes={[]}
        selectedIndex={0}
        onHighlightIndex={() => {}}
        onSelect={() => {}}
        emptyMessage={emptyMessage}
      />,
    );

    // Assert
    expect(screen.getByText(emptyMessage)).toBeTruthy();
  });

  it('lists notes and calls onSelect on click', () => {
    // Arrange
    const onSelect = vi.fn();
    const onHighlightIndex = vi.fn();

    // Act
    render(
      <NoteLinkMentionMenu
        open
        anchor={{ left: 10, top: 20 }}
        notes={[sampleNote]}
        selectedIndex={0}
        onHighlightIndex={onHighlightIndex}
        onSelect={onSelect}
        emptyMessage="No notes"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));

    // Assert
    expect(onSelect).toHaveBeenCalledWith(sampleNote);
  });

  it('highlights on mouse enter', () => {
    // Arrange
    const onHighlightIndex = vi.fn();
    const second = {
      ...sampleNote,
      id: 'bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee',
      title: 'Beta',
    };

    // Act
    render(
      <NoteLinkMentionMenu
        open
        anchor={{ left: 10, top: 20 }}
        notes={[sampleNote, second]}
        selectedIndex={0}
        onHighlightIndex={onHighlightIndex}
        onSelect={() => {}}
        emptyMessage="No notes"
      />,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Beta' }));

    // Assert
    expect(onHighlightIndex).toHaveBeenCalledWith(1);
  });
});
