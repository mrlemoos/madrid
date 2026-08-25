import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function loadAuthComponentSource(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(thisDir, 'nota-clerk-auth.tsx'), 'utf8');
}

describe('NotaClerk auth', () => {
  it('uses default Clerk SignIn with path routing on /signin', () => {
    // Arrange
    const source = loadAuthComponentSource();

    // Act
    const usesClerkReact = source.includes("from '@clerk/react'");
    const usesSignIn = source.includes('<SignIn');
    const usesPathProp = source.includes('path="/signin"');
    const avoidsHashRouting = !source.includes('routing="hash"');
    const avoidsElements = !source.includes('@clerk/elements');

    // Assert
    expect(usesClerkReact).toBe(true);
    expect(usesSignIn).toBe(true);
    expect(usesPathProp).toBe(true);
    expect(avoidsHashRouting).toBe(true);
    expect(avoidsElements).toBe(true);
  });

  it('uses default Clerk SignUp with path routing on /signup', () => {
    // Arrange
    const source = loadAuthComponentSource();

    // Act
    const usesSignUp = source.includes('<SignUp');
    const usesPathProp = source.includes('path="/signup"');

    // Assert
    expect(usesSignUp).toBe(true);
    expect(usesPathProp).toBe(true);
  });

  it('hides Clerk card chrome so the auth route card stays primary', () => {
    // Arrange
    const source = loadAuthComponentSource();

    // Act
    const hidesHeader =
      /header:\s*'hidden'/.test(source) ||
      /header:\s*\{\s*display:\s*'none'\s*\}/.test(source);
    const hidesFooter =
      /footer:\s*'hidden'/.test(source) ||
      /footer:\s*\{\s*display:\s*'none'\s*\}/.test(source);

    // Assert
    expect(hidesHeader).toBe(true);
    expect(hidesFooter).toBe(true);
  });

  it('uses Clerk shadcn theme and Nota form styling', () => {
    // Arrange
    const source = loadAuthComponentSource();

    // Act
    const usesShadcnTheme = source.includes("from '@clerk/ui/themes'");
    const appliesShadcn = source.includes('theme: shadcn');
    const scopesAuthClerk = source.includes('nota-auth-clerk');
    const hidesClerkLogo = source.includes("logoPlacement: 'none'");
    const disablesDevBadge = source.includes(
      'unsafe_disableDevelopmentModeWarnings: true',
    );
    const flattensClerkCard = source.includes('colorBackground:');
    const hidesSymbolArrow = source.includes("formButtonPrimary: 'Continue'");
    const hidesClerkButtonIcon = source.includes('formButtonPrimaryIcon:');
    const skipsContinueIconClass = !source.includes(
      'nota-auth-primary-with-icon',
    );
    const largerPrimaryType = source.includes(
      'nota-pressable nota-auth-continue h-10 w-full touch-manipulation text-base',
    );
    const usesThemeRadius = source.includes("borderRadius: 'var(--radius-md)'");

    // Assert
    expect(usesShadcnTheme).toBe(true);
    expect(appliesShadcn).toBe(true);
    expect(scopesAuthClerk).toBe(true);
    expect(hidesClerkLogo).toBe(true);
    expect(disablesDevBadge).toBe(true);
    expect(flattensClerkCard).toBe(true);
    expect(hidesSymbolArrow).toBe(true);
    expect(hidesClerkButtonIcon).toBe(true);
    expect(skipsContinueIconClass).toBe(true);
    expect(largerPrimaryType).toBe(true);
    expect(usesThemeRadius).toBe(true);
  });

  it('hides Clerk Continue icons and does not draw a replacement arrow', () => {
    // Arrange
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const css = readFileSync(resolve(thisDir, 'nota-clerk-auth.css'), 'utf8');

    // Act
    const hidesTriangle = css.includes('.cl-buttonArrowIcon');
    const drawsStrokeArrow = css.includes('nota-auth-primary-with-icon::after');
    const drawsMaskArrow = css.includes("stroke-linecap='round'");

    // Assert
    expect(hidesTriangle).toBe(true);
    expect(drawsStrokeArrow).toBe(false);
    expect(drawsMaskArrow).toBe(false);
  });

  it('draws a liquid-metal Continue border on hover and focus', () => {
    // Arrange
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const css = readFileSync(resolve(thisDir, 'nota-clerk-auth.css'), 'utf8');

    // Act
    const declaresMetalAngle = css.includes('--nota-metal-angle');
    const spinsMetal = css.includes('@keyframes nota-liquid-metal');
    const hoverShowsMetal = css.includes('.nota-auth-continue:hover::before');
    const focusShowsMetal = css.includes(
      '.nota-auth-continue:focus-visible::before',
    );
    const respectsReducedMotion = css.includes(
      'prefers-reduced-motion: reduce',
    );

    // Assert
    expect(declaresMetalAngle).toBe(true);
    expect(spinsMetal).toBe(true);
    expect(hoverShowsMetal).toBe(true);
    expect(focusShowsMetal).toBe(true);
    expect(respectsReducedMotion).toBe(true);
  });
});
