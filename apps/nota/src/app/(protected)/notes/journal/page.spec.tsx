import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const navigateFromLegacyPath = vi.fn();
const journalProps = { current: null as Record<string, unknown> | null };

vi.mock('@getmadrid/note-journal-ui/journal-screen', () => ({
  JournalScreen: (props: Record<string, unknown>) => {
    journalProps.current = props;
    return <div data-testid="journal" />;
  },
}));
vi.mock('@getmadrid/app-navigation-core/navigation', () => ({
  navigateFromLegacyPath,
}));

const { default: NotesJournalPage } = await import('./page');

describe('NotesJournalPage', () => {
  it('renders the journal', () => {
    // Arrange|Act
    render(<NotesJournalPage />);

    // Assert
    expect(screen.getByTestId('journal')).toBeTruthy();
  });

  it('opens a journal entry as a note', () => {
    // Arrange
    render(<NotesJournalPage />);

    // Act
    (journalProps.current?.onOpenNote as (id: string) => void)('note-1');

    // Assert
    expect(navigateFromLegacyPath).toHaveBeenCalledWith('/notes/note-1');
  });
});
