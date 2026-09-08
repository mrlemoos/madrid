import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const params = { current: {} as Record<string, string | undefined> };
const panelProps = { current: null as Record<string, unknown> | null };

vi.mock('next/navigation', () => ({ useParams: () => params.current }));
vi.mock('@getmadrid/note-editor-ui/note-detail-panel', () => ({
  NoteDetailPanel: (props: Record<string, unknown>) => {
    panelProps.current = props;
    return <div data-testid="note-detail" />;
  },
}));

const { default: NotePage } = await import('./page');

beforeEach(() => {
  params.current = { id: 'note-1' };
  panelProps.current = null;
});

describe('NotePage', () => {
  it('opens the note named in the route', () => {
    // Arrange|Act
    render(<NotePage />);

    // Assert
    expect(screen.getByTestId('note-detail')).toBeTruthy();
    expect(panelProps.current?.noteId).toBe('note-1');
  });

  it('renders nothing while the route has no id yet', () => {
    // Arrange
    params.current = {};

    // Act
    const { container } = render(<NotePage />);

    // Assert
    expect(container.innerHTML).toBe('');
  });
});
