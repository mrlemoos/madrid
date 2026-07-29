import { describe, expect, it, vi } from 'vitest';
import { buildAppearanceCommands } from './palette-commands';

describe('buildAppearanceCommands', () => {
  it('lists the three theme choices with stable values', () => {
    // Arrange
    const ctx = { theme: 'light', setTheme: vi.fn(), close: vi.fn() };

    // Act
    const commands = buildAppearanceCommands(ctx);

    // Assert
    expect(commands.map((c) => c.value)).toEqual([
      'use-light-theme',
      'use-dark-theme',
      'use-system-theme',
    ]);
  });

  it('marks only the active theme as current', () => {
    // Arrange
    const ctx = { theme: 'dark', setTheme: vi.fn(), close: vi.fn() };

    // Act
    const commands = buildAppearanceCommands(ctx);

    // Assert
    const current = commands.filter((c) => c.current).map((c) => c.value);
    expect(current).toEqual(['use-dark-theme']);
  });

  it('running a command sets its theme then closes the palette', () => {
    // Arrange
    const setTheme = vi.fn();
    const close = vi.fn();
    const commands = buildAppearanceCommands({
      theme: 'system',
      setTheme,
      close,
    });

    // Act
    commands[1].run();

    // Assert
    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(close).toHaveBeenCalledTimes(1);
  });
});
