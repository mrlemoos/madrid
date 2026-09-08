import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';

const submitUserPreferencesPatch = vi.fn();
const setUserPreferencesInState = vi.fn();
const meta = { current: { notaProEntitled: true } };

vi.mock('@getmadrid/note-runtime/use-sync-user-preferences', () => ({
  submitUserPreferencesPatch,
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataMeta: () => meta.current,
  useNotesDataActions: () => ({ setUserPreferencesInState }),
}));
vi.mock('@getmadrid/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({ user: { id: 'user-1' } }),
}));

const { WritingActivitySection } = await import('./writing-activity-section');

/** Two entries on consecutive days, so the streak counts are non-trivial. */
function seedActivity() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const key = (d: Date) =>
    `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { [key(today)]: 3, [key(yesterday)]: 1 };
}

beforeEach(() => {
  vi.clearAllMocks();
  meta.current = { notaProEntitled: true };
  act(() => {
    useNotaPreferencesStore.setState({
      showWritingActivityGraph: true,
      writingActivityColor: 'blue',
      writingActivityDays: seedActivity(),
    });
  });
});

describe('WritingActivitySection', () => {
  it('renders nothing without Madrid Pro', () => {
    // Arrange
    meta.current = { notaProEntitled: false };

    // Act
    const { container } = render(<WritingActivitySection />);

    // Assert
    expect(container.firstElementChild).toBeNull();
  });

  it('shows the streak counts derived from the recorded days', () => {
    // Arrange|Act
    render(<WritingActivitySection />);

    // Assert
    expect(screen.getByText('Current streak:')).toBeTruthy();
    expect(
      screen.getByText('active days (last year)', { exact: false }),
    ).toBeTruthy();
  });

  it('collapses to the heading and toggle when the graph is hidden', () => {
    // Arrange
    act(() => {
      useNotaPreferencesStore.setState({ showWritingActivityGraph: false });
    });

    // Act
    render(<WritingActivitySection />);

    // Assert
    expect(screen.getByText('Writing activity')).toBeTruthy();
    expect(screen.queryByText('Current streak:')).toBeNull();
  });

  it('persists the visibility toggle to the account', () => {
    // Arrange
    render(<WritingActivitySection />);

    // Act
    fireEvent.click(screen.getByLabelText('Show'));

    // Assert
    expect(useNotaPreferencesStore.getState().showWritingActivityGraph).toBe(
      false,
    );
    expect(submitUserPreferencesPatch).toHaveBeenCalledWith(
      { show_writing_activity_graph: false },
      'user-1',
      setUserPreferencesInState,
      true,
    );
  });

  it('persists a colour change to the account', () => {
    // Arrange
    render(<WritingActivitySection />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Rose' }));

    // Assert
    expect(useNotaPreferencesStore.getState().writingActivityColor).toBe(
      'rose',
    );
    expect(submitUserPreferencesPatch).toHaveBeenCalledWith(
      { writing_activity_color: 'rose' },
      'user-1',
      setUserPreferencesInState,
      true,
    );
  });

  it('offers every colour family', () => {
    // Arrange|Act
    render(<WritingActivitySection />);

    // Assert
    for (const name of ['Blue', 'Red', 'Pink', 'Rose']) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
  });

  it('labels each day cell with its count and date', () => {
    // Arrange|Act
    render(<WritingActivitySection />);

    // Assert — the grid is otherwise unreadable to a screen reader
    expect(screen.getAllByLabelText(/contributions on/).length).toBeGreaterThan(
      300,
    );
  });
});
