import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function loadThemeTokens(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(thisDir, 'theme-tokens.css'), 'utf8');
}

describe('theme radius tokens', () => {
  it('rounds a step softer than the default 10px plate, and maps md to that scale', () => {
    // Arrange
    const css = loadThemeTokens();

    // Act
    const rootRadius = /:root\s*\{[\s\S]*?--radius:\s*([^;]+);/.exec(css)?.[1];
    const mapsMd = css.includes('--radius-md: calc(var(--radius) - 2px)');
    const mapsLg = css.includes('--radius-lg: var(--radius)');

    // Assert
    expect(rootRadius?.trim()).toBe('0.875rem');
    expect(mapsMd).toBe(true);
    expect(mapsLg).toBe(true);
  });
});
