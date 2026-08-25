import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_CARD_ORIGIN_KEY } from '@/lib/auth-card-origin';
import { LandingPage } from './landing-page';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
    onClick,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
    onClick?: (event: {
      currentTarget: EventTarget & HTMLAnchorElement;
    }) => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('@nota/electron-bridge-ui/use-is-electron', () => ({
  useIsElectron: () => true,
}));

describe('LandingPage', () => {
  it('anchors email CTA at the bottom-right with no card chrome', () => {
    // Arrange
    const ui = <LandingPage />;

    // Act
    const { container } = render(ui);
    const heading = screen.getByRole('heading', {
      name: 'Think clearly. Write slowly.',
    });
    const continueLink = screen.getByRole('link', {
      name: /Continue with email/,
    });
    const signupLink = screen.getByRole('link', { name: /Create an account/ });
    const cluster = continueLink.closest('[data-nota-landing-cta]');

    // Assert
    expect(container.querySelector('[data-slot="card"]')).toBeNull();
    expect(heading.closest('[data-nota-landing-cta]')).toBeNull();
    expect(continueLink.querySelector('svg')).toBeNull();
    expect(continueLink.className).toMatch(/text-base/);
    expect(cluster).not.toBeNull();
    expect(cluster?.className).toMatch(/bottom-/);
    expect(cluster?.className).toMatch(/right-/);
    expect(
      signupLink.compareDocumentPosition(continueLink) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector('.electron-window-drag')).not.toBeNull();
  });

  it('stores the email CTA box so the sign-in card can grow from it', () => {
    // Arrange
    render(<LandingPage />);
    const continueLink = screen.getByRole('link', {
      name: /Continue with email/,
    });
    vi.spyOn(continueLink, 'getBoundingClientRect').mockReturnValue({
      x: 24,
      y: 12,
      top: 12,
      left: 24,
      width: 160,
      height: 40,
      bottom: 52,
      right: 184,
      toJSON: () => ({}),
    });
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      borderTopLeftRadius: '8px',
    } as CSSStyleDeclaration);

    // Act
    fireEvent.click(continueLink);
    const stored = JSON.parse(
      sessionStorage.getItem(AUTH_CARD_ORIGIN_KEY) ?? 'null',
    ) as { width: number; height: number; radius: number } | null;

    // Assert
    expect(stored?.width).toBe(160);
    expect(stored?.height).toBe(40);
    expect(stored?.radius).toBe(8);
  });
});
