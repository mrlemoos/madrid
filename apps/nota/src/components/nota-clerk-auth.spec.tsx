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

    // Assert
    expect(usesShadcnTheme).toBe(true);
    expect(appliesShadcn).toBe(true);
    expect(scopesAuthClerk).toBe(true);
    expect(hidesClerkLogo).toBe(true);
    expect(disablesDevBadge).toBe(true);
    expect(flattensClerkCard).toBe(true);
  });
});
