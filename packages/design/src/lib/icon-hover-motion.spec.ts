import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

import {
  NOTA_ICON_HOVER_MEDIA,
  canRunIconHoverMotion,
  gateIconHover,
} from './icon-hover-motion.js';

describe('canRunIconHoverMotion', () => {
  it('allows hover motion only for fine hover pointers without reduced motion', () => {
    // Arrange
    const matchMedia = (query: string) => ({
      matches:
        query === NOTA_ICON_HOVER_MEDIA
          ? true
          : query === '(prefers-reduced-motion: reduce)'
            ? false
            : false,
    });

    // Act
    const allowed = canRunIconHoverMotion(matchMedia);

    // Assert
    expect(allowed).toBe(true);
  });

  it('blocks hover motion when prefers-reduced-motion is reduce', () => {
    // Arrange
    const matchMedia = (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    });

    // Act
    const allowed = canRunIconHoverMotion(matchMedia);

    // Assert
    expect(allowed).toBe(false);
  });

  it('blocks hover motion when pointer is not fine hover', () => {
    // Arrange
    const matchMedia = (query: string) => ({
      matches: false,
    });

    // Act
    const allowed = canRunIconHoverMotion(matchMedia);

    // Assert
    expect(allowed).toBe(false);
  });
});

describe('gateIconHover', () => {
  it('invokes the handler only when hover motion is allowed', async () => {
    // Arrange
    const run = vi.fn();
    const allow = (query: string) => ({
      matches: query === NOTA_ICON_HOVER_MEDIA,
    });
    const deny = () => ({ matches: false });

    // Act
    await gateIconHover(run, allow)();
    await gateIconHover(run, deny)();

    // Assert
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('icon hover wiring', () => {
  it('gates animated icon hover handlers behind canRunIconHoverMotion', () => {
    // Arrange
    const iconSources = readdirSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../icons'),
    )
      .filter(
        (name) =>
          name.endsWith('-icon.tsx') ||
          name === 'bulb-svg.tsx' ||
          name === 'apple-brand-logo.tsx',
      )
      .map((name) =>
        readFileSync(
          resolve(dirname(fileURLToPath(import.meta.url)), '../icons', name),
          'utf8',
        ),
      );

    // Act
    const withHover = iconSources.filter((src) =>
      src.includes('onHoverStart='),
    );

    // Assert
    expect(withHover.length).toBeGreaterThan(0);
    for (const src of withHover) {
      expect(src).toContain('gateIconHover');
      expect(src).toContain("from '../lib/icon-hover-motion.js'");
    }
  });
});
