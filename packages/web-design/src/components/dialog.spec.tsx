import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  NotaDialog,
  NotaDialogContent,
  NotaDialogTitle,
  NotaDialogTrigger,
} from './dialog.js';

describe('NotaDialog', () => {
  it('opens from the trigger and shows the titled content', () => {
    // Arrange
    render(
      <NotaDialog>
        <NotaDialogTrigger>Open layout</NotaDialogTrigger>
        <NotaDialogContent showCloseButton={false}>
          <NotaDialogTitle>Note layout</NotaDialogTitle>
          <p>Theme options</p>
        </NotaDialogContent>
      </NotaDialog>,
    );

    // Act
    expect(screen.queryByText('Theme options')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open layout' }));

    // Assert
    expect(screen.getByRole('dialog', { name: 'Note layout' })).toBeTruthy();
    expect(screen.getByText('Theme options')).toBeTruthy();
  });
});
