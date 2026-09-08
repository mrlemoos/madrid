import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const setTheme = vi.fn();
const theme = { current: 'system' as 'light' | 'dark' | 'system' };

vi.mock('@getmadrid/design/theme', () => ({
  useTheme: () => ({ theme: theme.current, setTheme }),
}));

const { ThemeMenu } = await import('./theme-menu');

beforeEach(() => {
  vi.clearAllMocks();
  theme.current = 'system';
});

describe('ThemeMenu', () => {
  it('shows the theme currently in force', () => {
    // Arrange
    theme.current = 'dark';

    // Act
    render(<ThemeMenu />);

    // Assert
    expect(screen.getByRole('button', { name: 'Theme' }).textContent).toContain(
      'Dark',
    );
  });

  it('offers light, dark and system', async () => {
    // Arrange
    render(<ThemeMenu />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Theme' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeTruthy();
    });
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: 'System' })).toBeTruthy();
  });

  it('marks the current theme as chosen', async () => {
    // Arrange
    theme.current = 'light';
    render(<ThemeMenu />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Theme' }));

    // Assert
    await waitFor(() => {
      expect(
        screen
          .getByRole('menuitemradio', { name: 'Light' })
          .getAttribute('aria-checked'),
      ).toBe('true');
    });
  });

  it('switches the theme when another one is picked', async () => {
    // Arrange
    render(<ThemeMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Theme' }));

    // Act
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

    // Assert
    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
