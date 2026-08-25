import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthCardTitle } from './auth-card-title';

describe('AuthCardTitle', () => {
  it('sets the card heading in Bricolage Grotesque', () => {
    // Arrange
    const ui = (
      <AuthCardTitle description="Enter your email to sign in.">
        Sign in
      </AuthCardTitle>
    );

    // Act
    const heading = render(ui).getByRole('heading', { name: 'Sign in' });

    // Assert
    expect(heading.tagName).toBe('H2');
    expect(heading.style.fontFamily).toMatch(/Bricolage Grotesque/);
  });

  it('keeps the supporting line for screen readers only', () => {
    // Arrange
    const ui = (
      <AuthCardTitle description="Enter your email to sign in.">
        Sign in
      </AuthCardTitle>
    );

    // Act
    const { getByText } = render(ui);
    const description = getByText('Enter your email to sign in.');

    // Assert
    expect(description.getAttribute('data-slot')).toBe('card-description');
    expect(description.className).toMatch(/(?:^|\s)sr-only(?:\s|$)/);
  });
});
