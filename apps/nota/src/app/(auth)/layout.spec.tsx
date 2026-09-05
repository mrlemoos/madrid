import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthLayout from './layout';
import { AUTH_CARD_ORIGIN_KEY } from '@/lib/auth-card-origin';

const thisDir = dirname(fileURLToPath(import.meta.url));
const stylesCss = readFileSync(resolve(thisDir, '../../../styles.css'), 'utf8');
const themeChromeCss = readFileSync(
  resolve(thisDir, '../../../../../packages/design/src/theme-chrome.css'),
  'utf8',
);

vi.mock('@getmadrid/electron-bridge-ui/use-is-electron', () => ({
  useIsElectron: () => true,
}));

describe('auth layout', () => {
  it('keeps the brand line on the painting and a solid form card', () => {
    // Arrange
    const ui = (
      <AuthLayout footer={<span>Switch</span>}>
        <div>Clerk form</div>
      </AuthLayout>
    );

    // Act
    const { container } = render(ui);
    const heading = screen.getByRole('heading', {
      name: 'Think clearly. Write slowly.',
    });
    const card = container.querySelector('[data-slot="card"]');

    // Assert
    expect(heading.closest('[data-slot="card"]')).toBeNull();
    expect(card?.className).toMatch(/(?:^|\s)bg-background(?:\s|$)/);
    expect(card?.className).not.toContain('bg-background/');
    expect(card?.className).not.toContain('backdrop-blur');
    expect(card?.textContent).toContain('Clerk form');
    expect(container.querySelector('.electron-window-drag')).not.toBeNull();
  });

  it('sets a Grotesque title inside the form card', () => {
    // Arrange
    const ui = (
      <AuthLayout
        header={<h2 style={{ fontFamily: 'Bricolage Grotesque' }}>Sign in</h2>}
        footer={<span>Switch</span>}
      >
        <div>Clerk form</div>
      </AuthLayout>
    );

    // Act
    const { container } = render(ui);
    const title = screen.getByRole('heading', { name: 'Sign in' });
    const card = container.querySelector('[data-slot="card"]');

    // Assert
    expect(title.closest('[data-slot="card"]')).toBe(card);
    expect(title.style.fontFamily).toMatch(/Bricolage Grotesque/);
    expect(
      screen
        .getByRole('heading', { name: 'Think clearly. Write slowly.' })
        .closest('[data-slot="card"]'),
    ).toBeNull();
  });

  it('opens the form card as a centred modal and tweens its height', () => {
    // Arrange
    const ui = (
      <AuthLayout footer={<span>Switch</span>}>
        <div>Clerk form</div>
      </AuthLayout>
    );

    // Act
    const { container } = render(ui);
    const shell = container.querySelector('.t-modal');

    // Assert
    expect(shell).not.toBeNull();
    expect(shell?.classList.contains('t-resize')).toBe(true);
    expect(shell?.classList.contains('is-open')).toBe(true);
    expect(stylesCss).not.toContain('@keyframes nota-auth-card-enter');
    expect(themeChromeCss).toContain('--modal-open-dur: 250ms');
    expect(themeChromeCss).toContain('--resize-dur: 300ms');
    expect(themeChromeCss).toContain('.t-modal.is-open');
    expect(themeChromeCss).toContain('@starting-style');
    expect(themeChromeCss).toContain('interpolate-size: allow-keywords');
    expect(themeChromeCss).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*\.t-modal/,
    );
    expect(themeChromeCss).toContain('--morph-open-dur: 350ms');
  });

  it('grows the form card from a stored landing CTA box', () => {
    // Arrange
    sessionStorage.setItem(
      AUTH_CARD_ORIGIN_KEY,
      JSON.stringify({
        top: 200,
        left: 100,
        width: 50,
        height: 40,
        radius: 8,
        at: Date.now(),
      }),
    );
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        x: 10,
        y: 20,
        top: 20,
        left: 10,
        width: 100,
        height: 80,
        bottom: 100,
        right: 110,
        toJSON: () => ({}),
      });

    // Act
    const { container } = render(
      <AuthLayout footer={<span>Switch</span>}>
        <div>Clerk form</div>
      </AuthLayout>,
    );
    const shell = container.querySelector('.t-modal');

    // Assert
    expect(shell?.getAttribute('data-from-origin')).toBe('true');
    expect(shell?.style.transformOrigin).toBe('top left');
    expect(shell?.style.transform).toContain('translate(90px, 180px)');
    expect(shell?.style.transform).toContain('scale(0.5, 0.5)');
    expect(sessionStorage.getItem(AUTH_CARD_ORIGIN_KEY)).toBeNull();
    rectSpy.mockRestore();
  });
});
