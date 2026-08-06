import type { Theme } from './theme.js';

/** Hex equivalents of `:root` / `.dark` `--background` in app styles (Safari ignores oklch in meta). */
export const THEME_COLOR_LIGHT = '#ffffff';
export const THEME_COLOR_DARK = '#0a0a0a';

/** CSS custom property for hex page background (Safari 26 samples `body` / sticky chrome). */
export const BACKGROUND_HEX_CSS_VAR = '--background-hex';

export type ResolvedTheme = 'light' | 'dark';

export function themeColorForResolved(resolved: ResolvedTheme): string {
  return resolved === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
}

/** Maps a hex `theme-color` meta value to document `color-scheme` (Safari chrome). */
export function chromeSchemeForThemeColor(themeColor: string): ResolvedTheme {
  return themeColor.toLowerCase() === THEME_COLOR_DARK ? 'dark' : 'light';
}

/** Resolves stored preference + system appearance to a paint theme. */
export function resolveStoredTheme(
  stored: string | null,
  systemDark: boolean,
  defaultTheme: Theme = 'system',
): ResolvedTheme {
  if (stored === 'dark') return 'dark';
  if (stored === 'light') return 'light';
  if (stored === 'system') return systemDark ? 'dark' : 'light';
  if (defaultTheme === 'dark') return 'dark';
  if (defaultTheme === 'light') return 'light';
  return systemDark ? 'dark' : 'light';
}

export function resolveThemePreference(
  theme: Theme,
  systemDark: boolean,
): ResolvedTheme {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return systemDark ? 'dark' : 'light';
}

const THEME_COLOR_META = 'theme-color';
const THEME_COLOR_META_ID = 'nota-theme-color';

/** Updates (or creates) the document `theme-color` meta for Safari / mobile browser chrome. */
export function applyThemeColorMeta(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const content = themeColorForResolved(resolved);
  let meta: HTMLMetaElement | null = document.getElementById(
    THEME_COLOR_META_ID,
  ) as HTMLMetaElement | null;
  meta ??= document.querySelector<HTMLMetaElement>(
    `meta[name="${THEME_COLOR_META}"]:not([media])`,
  );
  meta ??= document.querySelector<HTMLMetaElement>(
    `meta[name="${THEME_COLOR_META}"]`,
  );

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = THEME_COLOR_META;
    meta.id = THEME_COLOR_META_ID;
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
  meta.removeAttribute('media');
}

/** Sets hex `--background-hex` and `body` background for Safari 26 toolbar tinting. */
export function applySafariChromeBackground(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const hex = themeColorForResolved(resolved);
  document.documentElement.style.setProperty(BACKGROUND_HEX_CSS_VAR, hex);

  if (document.documentElement.classList.contains('nota-electron')) {
    return;
  }

  document.body.style.backgroundColor = hex;
}
