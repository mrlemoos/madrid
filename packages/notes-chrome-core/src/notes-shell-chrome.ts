import { cn } from '@nota/web-design/utils';

/** Target for `prefers-reduced-transparency` overrides in `styles.css`. */
export const NOTA_NOTES_SIDEBAR_CHROME_CLASS = 'nota-notes-sidebar-chrome';

/** Target for `prefers-reduced-transparency` overrides in `styles.css`. */
export const NOTA_NOTES_MAIN_CHROME_CLASS = 'nota-notes-main-chrome';

/** Sticky doc title pill — scroll-edge fade defined in `styles.css`. */
export const NOTA_NOTES_STICKY_TITLE_CHROME_CLASS =
  'nota-notes-sticky-title-chrome';

/**
 * Glassmorphic chrome for the notes sidebar rail: darker tint than main, stronger blur,
 * subtle right edge. Electron vibrancy + `backdrop-filter` stack for wallpaper bleed-through.
 * Heavier material = structure (AppKit sidebar weight).
 */
export const notesSidebarChrome = cn(
  NOTA_NOTES_SIDEBAR_CHROME_CLASS,
  'border-r border-sidebar-border/70',
  'bg-sidebar/55 dark:border-white/10 dark:bg-black/42',
  'backdrop-blur-3xl backdrop-saturate-150',
  'text-foreground',
);

/**
 * Glassmorphic chrome for the notes main panel: frosted but milder blur / lighter tint
 * than the sidebar so the editor stays readable (content material).
 */
export const notesMainChrome = cn(
  NOTA_NOTES_MAIN_CHROME_CLASS,
  'bg-background/38 dark:bg-background/28',
  'backdrop-blur-xl backdrop-saturate-150',
  'text-foreground',
);

/**
 * Sticky note title overlay: opaque enough to stay legible over main glass;
 * CSS adds a soft scroll-edge fade (no hard hairline).
 */
export const notesStickyTitleChrome = cn(
  NOTA_NOTES_STICKY_TITLE_CHROME_CLASS,
  'max-w-[min(20rem,calc(100%-2rem))] truncate rounded-md',
  'bg-background/90 px-3 py-1 text-center text-sm font-medium text-foreground',
  'backdrop-blur-md backdrop-saturate-150',
);
