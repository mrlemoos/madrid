import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = { current: { userId: null as string | null } };

vi.mock('@clerk/react', () => ({ useAuth: () => auth.current }));

const { default: NotFound } = await import('./not-found');

beforeEach(() => {
  auth.current = { userId: null };
});

describe('NotFound', () => {
  it('sends a signed-out visitor home', () => {
    // Arrange|Act
    render(<NotFound />);

    // Assert
    expect(
      screen.getByRole('link', { name: /Return home/ }).getAttribute('href'),
    ).toBe('/');
  });

  it('sends a signed-in reader back to their notes', () => {
    // Arrange
    auth.current = { userId: 'user-1' };

    // Act
    render(<NotFound />);

    // Assert
    expect(
      screen.getByRole('link', { name: /Back to notes/ }).getAttribute('href'),
    ).toBe('/notes');
  });
});
