import { describe, expect, it } from 'vitest';

import {
  chromeSchemeForThemeColor,
  MKT_THEME_COLOR_HERO,
  MKT_THEME_COLOR_META_ID,
  MKT_THEME_COLOR_PAGE,
} from './marketing-theme';

describe('chromeSchemeForThemeColor', () => {
  it('reads the dark bands as a dark colour scheme', () => {
    // Arrange|Act|Assert
    expect(chromeSchemeForThemeColor(MKT_THEME_COLOR_HERO)).toBe('dark');
  });

  it('reads the page ground as light', () => {
    // Arrange|Act|Assert
    expect(chromeSchemeForThemeColor(MKT_THEME_COLOR_PAGE)).toBe('light');
  });

  it('ignores hex casing', () => {
    // Arrange|Act|Assert
    expect(chromeSchemeForThemeColor(MKT_THEME_COLOR_HERO.toUpperCase())).toBe(
      'dark',
    );
  });

  it('falls back to light for any colour it does not know', () => {
    // Arrange|Act|Assert
    expect(chromeSchemeForThemeColor('#ff00ff')).toBe('light');
  });
});

describe('marketing theme tokens', () => {
  it('keeps ground and hero as distinct six-digit hex values', () => {
    // Arrange|Act|Assert — `theme-color` meta will not accept oklch()
    expect(MKT_THEME_COLOR_PAGE).toMatch(/^#[0-9a-f]{6}$/);
    expect(MKT_THEME_COLOR_HERO).toMatch(/^#[0-9a-f]{6}$/);
    expect(MKT_THEME_COLOR_PAGE).not.toBe(MKT_THEME_COLOR_HERO);
  });

  it('names the meta tag Safari reads', () => {
    // Arrange|Act|Assert
    expect(MKT_THEME_COLOR_META_ID).toBe('mkt-theme-color');
  });
});
