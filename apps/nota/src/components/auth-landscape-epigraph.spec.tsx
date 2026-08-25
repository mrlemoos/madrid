import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthLandscapeEpigraph } from './auth-landscape-epigraph';

describe('AuthLandscapeEpigraph', () => {
  it('sets the brand line freely on the painting, with no plate or logo', () => {
    // Arrange
    const ui = <AuthLandscapeEpigraph />;

    // Act
    const { container } = render(ui);
    const heading = screen.getByRole('heading', {
      name: 'Think clearly. Write slowly.',
    });
    const root = heading.parentElement;
    const rootClass = root?.getAttribute('class') ?? '';

    // Assert
    expect(
      screen.getByText('A quiet space for your thoughts, away from the noise.'),
    ).toBeTruthy();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('[data-nota-landscape-scrim]')).toBeNull();
    expect(rootClass).not.toMatch(/bg-black/);
    expect(rootClass).not.toMatch(/rounded/);
    expect(heading.style.fontFamily).toMatch(/Bricolage Grotesque/);
  });
});
