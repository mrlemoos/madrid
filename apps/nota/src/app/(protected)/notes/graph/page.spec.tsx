import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';

const navigateFromLegacyPath = vi.fn();
const graphProps = { current: null as Record<string, unknown> | null };
const notes = [{ id: 'note-1' }] as Note[];

vi.mock('@getmadrid/note-graph', () => ({
  NotesGraphScreen: (props: Record<string, unknown>) => {
    graphProps.current = props;
    return <div data-testid="graph" />;
  },
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataVault: () => ({ notes }),
}));
vi.mock('@getmadrid/app-navigation-core/navigation', () => ({
  navigateFromLegacyPath,
}));

const { default: NotesGraphPage } = await import('./page');

describe('NotesGraphPage', () => {
  it('draws the graph over the loaded vault', () => {
    // Arrange|Act
    render(<NotesGraphPage />);

    // Assert
    expect(screen.getByTestId('graph')).toBeTruthy();
    expect(graphProps.current?.notes).toBe(notes);
  });

  it('opens a node as a note, flagging pointer intent', () => {
    // Arrange
    render(<NotesGraphPage />);

    // Act
    (graphProps.current?.onOpenNote as (id: string) => void)('note-1');

    // Assert — a click may animate; keyboard navigation stays instant
    expect(navigateFromLegacyPath).toHaveBeenCalledWith('/notes/note-1', {
      intent: 'pointer',
    });
  });
});
