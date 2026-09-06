import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNotesSidebarShortcut } from './use-notes-sidebar-shortcut';

const toggle = vi.fn();

vi.mock('@getmadrid/note-runtime/stores/sidebar', () => ({
  useNotesSidebarStore: {
    getState: () => ({ toggle }),
  },
}));

function ShortcutHarness(): null {
  useNotesSidebarShortcut('user_123');
  return null;
}

describe('useNotesSidebarShortcut', () => {
  it('does not intercept Cmd+S while editing a note', () => {
    // Arrange
    toggle.mockClear();
    render(
      <>
        <ShortcutHarness />
        <textarea aria-label="Note body" />
      </>,
    );

    // Act
    const event = fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 's',
      metaKey: true,
    });

    // Assert
    expect(event).toBe(true);
    expect(toggle).not.toHaveBeenCalled();
  });
});
