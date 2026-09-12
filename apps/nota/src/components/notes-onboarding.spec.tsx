import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const upsertUserPreferences = vi.fn();
const setUserPreferencesInState = vi.fn();
const browserClient = {};

vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  getBrowserClient: () => browserClient,
}));
vi.mock('@getmadrid/data-source/models/user-preferences', () => ({
  upsertUserPreferences,
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataActions: () => ({ setUserPreferencesInState }),
  useNotesDataMeta: () => ({
    loading: false,
    notaProEntitled: true,
    userPreferences: { user_id: 'user-1', onboarding_version: null },
  }),
}));
vi.mock('@/lib/use-nota-translator', () => ({
  useNotaTranslator: () => ({ t: (key: string) => key }),
}));

const { NotesOnboarding } = await import('./notes-onboarding');

describe('NotesOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertUserPreferences.mockResolvedValue({ onboarding_version: 3 });
  });

  it('records a skipped questionnaire for an existing user', async () => {
    // Arrange
    render(<NotesOnboarding />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    // Assert
    await waitFor(() => {
      expect(upsertUserPreferences).toHaveBeenCalledWith(
        browserClient,
        'user-1',
        { onboarding_version: 3 },
      );
    });
    expect(setUserPreferencesInState).toHaveBeenCalledWith({
      onboarding_version: 3,
    });
  });

  it('asks about language, writing streaks, and daily notes', () => {
    // Arrange
    render(<NotesOnboarding />);

    // Act
    fireEvent.click(
      screen.getByRole('radio', { name: 'English (United Kingdom)' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Assert
    expect(screen.getByText('Would you like a writing streak?')).toBeTruthy();

    // Act
    fireEvent.click(screen.getByRole('radio', { name: 'Yes, show my streak' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Assert
    expect(
      screen.getByText('Would you like a daily note shortcut?'),
    ).toBeTruthy();
  });

  it('saves the selected questionnaire preferences', async () => {
    // Arrange
    render(<NotesOnboarding />);

    // Act
    fireEvent.click(screen.getByRole('radio', { name: 'Spanish (Spain)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes, show my streak' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes, enable it' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

    // Assert
    await waitFor(() => {
      expect(upsertUserPreferences).toHaveBeenCalledWith(
        browserClient,
        'user-1',
        {
          onboarding_version: 3,
          locale: 'es-ES',
          show_writing_activity_graph: true,
          open_todays_note_shortcut: true,
        },
      );
    });
  });
});
