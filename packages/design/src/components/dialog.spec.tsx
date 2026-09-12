import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog.js';

describe('Dialog', () => {
  it('opens from the trigger and shows the titled content', () => {
    // Arrange
    render(
      <Dialog>
        <DialogTrigger>Open layout</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Note layout</DialogTitle>
          <p>Theme options</p>
        </DialogContent>
      </Dialog>,
    );

    // Act
    expect(screen.queryByText('Theme options')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open layout' }));

    // Assert
    expect(screen.getByRole('dialog', { name: 'Note layout' })).toBeTruthy();
    expect(screen.getByText('Theme options')).toBeTruthy();
  });

  it('can blur the backdrop', () => {
    // Arrange
    render(
      <Dialog open>
        <DialogContent blurBackdrop showCloseButton={false}>
          <DialogTitle>Welcome</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    // Act
    const backdrop = document.querySelector('[data-slot="dialog-overlay"]');

    // Assert
    expect(backdrop?.getAttribute('data-blurred-backdrop')).toBe('true');
  });
});
