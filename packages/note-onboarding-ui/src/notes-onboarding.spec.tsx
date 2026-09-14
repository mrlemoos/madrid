import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotesOnboarding } from './notes-onboarding';

const t = (key: string): string => key;

describe('NotesOnboarding', () => {
  it('submits the selected preferences', async () => {
    // Arrange
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<NotesOnboarding onComplete={onComplete} t={t} />);

    // Act
    fireEvent.click(screen.getByRole('radio', { name: 'Spanish (Spain)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes, show my streak' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes, enable it' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Titles on their own' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(
      screen.getByRole('radio', { name: 'A folder icon in its colour' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

    // Assert
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        locale: 'es-ES',
        show_writing_activity_graph: true,
        open_todays_note_shortcut: true,
        show_sidebar_note_icons: false,
        show_sidebar_folder_icons: true,
      });
    });
  });
});
