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
    upsertUserPreferences.mockResolvedValue({ onboarding_version: 1 });
  });

  it('records a skipped onboarding for an existing user', async () => {
    // Arrange
    render(<NotesOnboarding />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

    // Assert
    await waitFor(() => {
      expect(upsertUserPreferences).toHaveBeenCalledWith(
        browserClient,
        'user-1',
        { onboarding_version: 1 },
      );
    });
    expect(setUserPreferencesInState).toHaveBeenCalledWith({
      onboarding_version: 1,
    });
  });

  it('shows the three agreed steps before opening notes', async () => {
    // Arrange
    render(<NotesOnboarding />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Assert
    expect(screen.getByText('Find it later')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open my notes' })).toBeTruthy();
  });
});
