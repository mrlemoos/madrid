import { afterEach, describe, expect, it } from 'vitest';

import {
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
  applySafariChromeBackground,
  applyThemeColorMeta,
  chromeSchemeForThemeColor,
  resolveStoredTheme,
  resolveThemePreference,
  themeColorForResolved,
} from './theme-color.js';

describe('theme-color (Safari meta)', () => {
  afterEach(() => {
    document.head
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((node) => {
        node.remove();
      });
  });

  it('maps resolved themes to hex (not oklch) for meta tag support', () => {
    // Arrange / Act / Assert
    expect(themeColorForResolved('light')).toBe(THEME_COLOR_LIGHT);
    expect(themeColorForResolved('dark')).toBe(THEME_COLOR_DARK);
    expect(THEME_COLOR_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
    expect(THEME_COLOR_DARK).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('resolveStoredTheme honours explicit and system preferences', () => {
    // Assert
    expect(resolveStoredTheme('dark', false)).toBe('dark');
    expect(resolveStoredTheme('light', true)).toBe('light');
    expect(resolveStoredTheme('system', true)).toBe('dark');
    expect(resolveStoredTheme('system', false)).toBe('light');
    expect(resolveStoredTheme(null, true, 'system')).toBe('dark');
    expect(resolveStoredTheme('invalid', false, 'light')).toBe('light');
  });

  it('chromeSchemeForThemeColor maps hex meta values to light or dark chrome', () => {
    // Assert
    expect(chromeSchemeForThemeColor(THEME_COLOR_DARK)).toBe('dark');
    expect(chromeSchemeForThemeColor(THEME_COLOR_LIGHT)).toBe('light');
    expect(chromeSchemeForThemeColor('#0A0A0A')).toBe('dark');
  });

  it('resolveThemePreference mirrors ThemeProvider resolution', () => {
    // Assert
    expect(resolveThemePreference('dark', false)).toBe('dark');
    expect(resolveThemePreference('light', true)).toBe('light');
    expect(resolveThemePreference('system', true)).toBe('dark');
  });

  it('applySafariChromeBackground paints body with hex (Safari 26 toolbar sampling)', () => {
    // Arrange
    document.documentElement.classList.remove('nota-electron');

    // Act
    applySafariChromeBackground('dark');

    // Assert
    expect(
      document.documentElement.style.getPropertyValue('--background-hex'),
    ).toBe(THEME_COLOR_DARK);
    expect(document.body.style.backgroundColor).toBe('rgb(10, 10, 10)');

    // Act
    applySafariChromeBackground('light');

    // Assert
    expect(document.body.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('applySafariChromeBackground skips body on Electron (transparent vibrancy)', () => {
    // Arrange
    document.documentElement.classList.add('nota-electron');
    document.body.style.backgroundColor = 'transparent';

    // Act
    applySafariChromeBackground('light');

    // Assert
    expect(document.body.style.backgroundColor).toBe('transparent');

    document.documentElement.classList.remove('nota-electron');
  });

  it('applyThemeColorMeta sets meta content and clears media', () => {
    // Arrange
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#000000';
    meta.media = '(prefers-color-scheme: dark)';
    document.head.appendChild(meta);

    // Act
    applyThemeColorMeta('light');

    // Assert
    const updated = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    expect(updated?.content).toBe(THEME_COLOR_LIGHT);
    expect(updated?.hasAttribute('media')).toBe(false);
  });
});
