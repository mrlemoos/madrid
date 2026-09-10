import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select.js';

describe('Select', () => {
  it('selects an item from the popup', () => {
    // Arrange
    const onValueChange = vi.fn();
    render(
      <Select
        defaultValue="en-GB"
        items={{ 'en-GB': 'English', 'es-ES': 'Español' }}
        onValueChange={onValueChange}
      >
        <SelectTrigger aria-label="Language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en-GB">English</SelectItem>
          <SelectItem value="es-ES">Español</SelectItem>
        </SelectContent>
      </Select>,
    );

    // Act
    fireEvent.click(screen.getByRole('combobox', { name: 'Language' }));
    const option = screen.getByRole('option', { name: 'Español' });
    fireEvent.mouseMove(option);
    fireEvent.click(option);

    // Assert
    expect(onValueChange).toHaveBeenCalledWith('es-ES', expect.anything());
  });
});
