import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './error-boundary';

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom from child');
  }
  return <span>child ok</span>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {
      // React logs caught render errors; keep the test output quiet.
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    // Arrange
    const child = <span>nota child</span>;

    // Act
    render(<ErrorBoundary locale="en-GB">{child}</ErrorBoundary>);

    // Assert
    expect(screen.getByText('nota child')).toBeTruthy();
  });

  it('shows a retry fallback when a child throws during render', () => {
    // Arrange
    const throwingChild = <Boom shouldThrow />;

    // Act
    render(<ErrorBoundary locale="en-GB">{throwingChild}</ErrorBoundary>);

    // Assert
    expect(
      screen.getByText(
        'Something went wrong loading Nota. You can try again or reload the app.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('boom from child')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.queryByText('child ok')).toBeNull();
  });

  it('renders children again after Try again once the child stops throwing', () => {
    // Arrange
    let shouldThrow = true;
    function Flaky() {
      if (shouldThrow) {
        throw new Error('boom from child');
      }
      return <span>recovered</span>;
    }
    render(
      <ErrorBoundary locale="en-GB">
        <Flaky />
      </ErrorBoundary>,
    );

    // Act
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Assert
    expect(screen.getByText('recovered')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});
