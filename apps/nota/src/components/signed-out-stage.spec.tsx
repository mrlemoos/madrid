import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { signedOutCardClass, SignedOutStage } from './signed-out-stage';

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as { nota?: unknown }).nota;
});

describe('SignedOutStage', () => {
  it('renders the content it is given inside the main landmark', () => {
    // Arrange|Act
    render(
      <SignedOutStage>
        <span>sign in form</span>
      </SignedOutStage>,
    );

    // Assert
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByText('sign in form')).toBeTruthy();
  });

  it('paints the landscape behind the content, hidden from screen readers', () => {
    // Arrange|Act
    const { container } = render(
      <SignedOutStage>
        <span>form</span>
      </SignedOutStage>,
    );

    // Assert
    const painting = container.querySelector('img[src="/nota-landscape.png"]');
    expect(painting).not.toBeNull();
    expect(painting?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('adds no Electron drag chrome in the browser', () => {
    // Arrange
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Safari/605' });

    // Act
    const { container } = render(
      <SignedOutStage>
        <span>form</span>
      </SignedOutStage>,
    );

    // Assert
    expect(container.querySelectorAll('.electron-window-drag')).toHaveLength(0);
  });

  it('makes the painting draggable in Electron, clearing the traffic lights', () => {
    // Arrange
    (window as { nota?: unknown }).nota = {};

    // Act
    const { container } = render(
      <SignedOutStage>
        <span>form</span>
      </SignedOutStage>,
    );

    // Assert — `-webkit-app-region` is behaviour: it moves the window
    expect(
      container.querySelectorAll('.electron-window-drag').length,
    ).toBeGreaterThan(0);
    expect(container.querySelector('.electron-window-no-drag')).not.toBeNull();
  });
});

describe('signedOutCardClass', () => {
  it('keeps the form surface opaque over the painting', () => {
    // Arrange|Act|Assert — a translucent card would make the form unreadable
    expect(signedOutCardClass).toContain('bg-background');
  });
});
