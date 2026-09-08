import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card.js';

describe('Card', () => {
  it('renders every slot it is given, in order', () => {
    // Arrange|Act
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Boarding pass</CardTitle>
          <CardDescription>Gate 14</CardDescription>
          <CardAction>menu</CardAction>
        </CardHeader>
        <CardContent>Seat 3A</CardContent>
        <CardFooter>Board at 09:10</CardFooter>
      </Card>,
    );

    // Assert
    expect(screen.getByText('Boarding pass')).toBeTruthy();
    expect(screen.getByText('Gate 14')).toBeTruthy();
    expect(screen.getByText('Seat 3A')).toBeTruthy();
    expect(screen.getByText('Board at 09:10')).toBeTruthy();
    expect(
      [...container.querySelectorAll('[data-slot]')].map((el) =>
        el.getAttribute('data-slot'),
      ),
    ).toEqual([
      'card',
      'card-header',
      'card-title',
      'card-description',
      'card-action',
      'card-content',
      'card-footer',
    ]);
  });

  it('publishes the density as data-size so descendants can read it', () => {
    // Arrange|Act
    const { container } = render(<Card size="sm">body</Card>);

    // Assert — `data-size` is the documented layout hook, not decoration
    expect(
      container.querySelector('[data-slot="card"]')?.getAttribute('data-size'),
    ).toBe('sm');
  });

  it('defaults the density and forwards div props', () => {
    // Arrange|Act
    render(<Card data-testid="plain">body</Card>);

    // Assert
    const card = screen.getByTestId('plain');
    expect(card.getAttribute('data-size')).toBe('default');
    expect(card.tagName).toBe('DIV');
  });
});
