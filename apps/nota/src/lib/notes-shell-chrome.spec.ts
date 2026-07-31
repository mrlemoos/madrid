import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  NOTA_NOTES_MAIN_CHROME_CLASS,
  NOTA_NOTES_SIDEBAR_CHROME_CLASS,
  NOTA_NOTES_STICKY_TITLE_CHROME_CLASS,
  notesMainChrome,
  notesSidebarChrome,
  notesStickyTitleChrome,
} from './notes-shell-chrome';

const stylesCss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../styles.css'),
  'utf8',
);

/** Independent Tailwind blur scale (px) — source of truth for hierarchy contracts. */
const BACKDROP_BLUR_PX: Record<string, number> = {
  'backdrop-blur-sm': 4,
  'backdrop-blur': 8,
  'backdrop-blur-md': 12,
  'backdrop-blur-lg': 16,
  'backdrop-blur-xl': 24,
  'backdrop-blur-2xl': 40,
  'backdrop-blur-3xl': 64,
};

function backdropBlurPx(classString: string): number {
  const tokens = Object.keys(BACKDROP_BLUR_PX).sort(
    (a, b) => b.length - a.length,
  );
  const match = tokens.find((token) =>
    new RegExp(`(?:^|\\s)${token}(?:\\s|$)`).test(classString),
  );
  if (!match) {
    throw new Error(`No backdrop-blur token in: ${classString}`);
  }
  return BACKDROP_BLUR_PX[match];
}

function opacityFraction(classString: string, prefix: string): number {
  const match = classString.match(
    new RegExp(`(?:^|\\s)${prefix.replace('/', '\\/')}(\\d+)(?:\\s|$)`),
  );
  if (!match) {
    throw new Error(`No opacity token ${prefix}* in: ${classString}`);
  }
  return Number(match[1]);
}

describe('notes shell chrome', () => {
  it('exposes stable marker classes for reduced-transparency CSS', () => {
    // Arrange
    const expectedSidebar = 'nota-notes-sidebar-chrome';
    const expectedMain = 'nota-notes-main-chrome';
    const expectedSticky = 'nota-notes-sticky-title-chrome';

    // Act & Assert
    expect(NOTA_NOTES_SIDEBAR_CHROME_CLASS).toBe(expectedSidebar);
    expect(NOTA_NOTES_MAIN_CHROME_CLASS).toBe(expectedMain);
    expect(NOTA_NOTES_STICKY_TITLE_CHROME_CLASS).toBe(expectedSticky);
  });

  it('keeps sidebar backdrop blur weight at least as heavy as main', () => {
    // Arrange
    const sidebar = notesSidebarChrome;
    const main = notesMainChrome;

    // Act
    const sidebarBlurPx = backdropBlurPx(sidebar);
    const mainBlurPx = backdropBlurPx(main);

    // Assert
    expect(sidebarBlurPx).toBeGreaterThanOrEqual(mainBlurPx);
    expect(sidebarBlurPx).toBeGreaterThanOrEqual(40);
    expect(mainBlurPx).toBeLessThanOrEqual(24);
  });

  it('uses a heavier frosted rail for the sidebar than the main panel', () => {
    // Arrange
    const sidebar = notesSidebarChrome;
    const main = notesMainChrome;

    // Act
    const sidebarLightOpacity = opacityFraction(sidebar, 'bg-sidebar/');
    const sidebarDarkOpacity = opacityFraction(sidebar, 'dark:bg-black/');
    const mainLightOpacity = opacityFraction(main, 'bg-background/');
    const mainDarkOpacity = opacityFraction(main, 'dark:bg-background/');

    // Assert — structure (sidebar) darker/heavier; content (main) milder
    expect(sidebar).toContain(NOTA_NOTES_SIDEBAR_CHROME_CLASS);
    expect(main).toContain(NOTA_NOTES_MAIN_CHROME_CLASS);
    expect(sidebar).toContain('border-r');
    expect(sidebarLightOpacity).toBeGreaterThanOrEqual(50);
    expect(sidebarDarkOpacity).toBeGreaterThanOrEqual(36);
    expect(mainLightOpacity).toBeLessThanOrEqual(42);
    expect(mainDarkOpacity).toBeLessThanOrEqual(32);
    expect(sidebarLightOpacity).toBeGreaterThan(mainLightOpacity);
  });

  it('gives sticky title readable chrome with scroll-edge fade hook', () => {
    // Arrange
    const sticky = notesStickyTitleChrome;

    // Act
    const opacity = opacityFraction(sticky, 'bg-background/');

    // Assert — opaque enough to avoid light-on-light over main glass
    expect(sticky).toContain(NOTA_NOTES_STICKY_TITLE_CHROME_CLASS);
    expect(opacity).toBeGreaterThanOrEqual(85);
    expect(sticky).toContain('text-foreground');
    expect(sticky).toContain('backdrop-blur');
  });
});

describe('notes shell chrome CSS contracts', () => {
  it('honours prefers-reduced-transparency with frostier solids', () => {
    // Arrange
    const reduceBlock = stylesCss.match(
      /@media \(prefers-reduced-transparency:\s*reduce\)\s*\{([\s\S]*?)\n\}(?=\n(?:\/\*|\.|@|html|$))/,
    );

    // Act
    expect(reduceBlock).not.toBeNull();
    const body = reduceBlock?.[1] ?? '';

    // Assert — blur off; near-solid fills for structure + content
    expect(body).toContain(`.${NOTA_NOTES_SIDEBAR_CHROME_CLASS}`);
    expect(body).toContain(`.${NOTA_NOTES_MAIN_CHROME_CLASS}`);
    expect(body).toMatch(
      /\.nota-notes-sidebar-chrome[\s\S]*?backdrop-filter:\s*none/,
    );
    expect(body).toMatch(
      /\.nota-notes-main-chrome[\s\S]*?backdrop-filter:\s*none/,
    );
    expect(body).toMatch(/var\(--sidebar\)\s*(9[6-9]|100)%/);
    expect(body).toMatch(/var\(--background\)\s*(9[7-9]|100)%/);
  });

  it('keeps Electron notes root transparent for vibrancy', () => {
    // Arrange / Act / Assert
    expect(stylesCss).toMatch(
      /html\.nota-electron\s*,\s*\nhtml\.nota-electron body\s*\{[\s\S]*?background-color:\s*transparent/,
    );
    expect(stylesCss).toMatch(
      /html\.nota-electron #root\s*\{[\s\S]*?background-color:\s*transparent/,
    );
    expect(stylesCss).toMatch(
      /html\.nota-electron \.nota-notes-root\s*\{[\s\S]*?background-color:\s*transparent/,
    );
  });

  it('defines sticky title scroll-edge fade instead of a hard hairline', () => {
    // Arrange
    const stickyRule = new RegExp(
      `\\.${NOTA_NOTES_STICKY_TITLE_CHROME_CLASS}[\\s\\S]{0,400}`,
    );

    // Act
    const match = stylesCss.match(stickyRule);

    // Assert
    expect(match).not.toBeNull();
    const rule = match?.[0] ?? '';
    expect(rule).toMatch(/linear-gradient|mask-image|box-shadow/);
    expect(rule).not.toMatch(/border-bottom:\s*1px/);
  });

  it('keeps banner sidebar blur heavier than transparent main', () => {
    // Arrange / Act
    const bannerSidebar = stylesCss.match(
      /\.nota-notes-root--banner \.nota-notes-sidebar-chrome\s*\{([\s\S]*?)\}/,
    );
    const bannerMain = stylesCss.match(
      /\.nota-notes-root--banner \.nota-notes-main-chrome\s*\{([\s\S]*?)\}/,
    );

    // Assert
    expect(bannerSidebar).not.toBeNull();
    expect(bannerMain).not.toBeNull();
    expect(bannerSidebar?.[1] ?? '').toMatch(/blur\(([4-9]\d|[1-9]\d{2,})px\)/);
    expect(bannerMain?.[1] ?? '').toMatch(/backdrop-filter:\s*none/);
  });
});
