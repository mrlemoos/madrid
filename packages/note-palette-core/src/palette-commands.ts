import type { IconName } from '@nota/design/icon';

export type NotaThemeChoice = 'light' | 'dark' | 'system';

/**
 * A flat, stateless palette command: pick it, it runs and closes. The command
 * palette renders these as data through one `<PaletteActionItem>`, so adding a
 * command is an entry in a builder — not another hand-written `Command.Item`.
 * (Stateful flows — move / tint / delete pickers — stay behind the palette mode
 * reducer; they are not flat commands.)
 */
export type PaletteActionCommand = {
  /** cmdk item value (stable id used for filtering + highlight). */
  value: string;
  label: string;
  keywords: string[];
  icon: IconName;
  tone: 'default' | 'destructive';
  /** Shows a trailing "(current)" marker (e.g. the active theme). */
  current: boolean;
  run: () => void;
};

export type ZoomCommandContext = {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  close: () => void;
};

const ZOOM_KEYWORDS = ['zoom', 'scale', 'text size', 'font size'];

/** ⌘= / ⌘- / ⌘0 as palette entries, for discoverability and pointer users. */
export function buildZoomCommands(
  ctx: ZoomCommandContext,
): PaletteActionCommand[] {
  const run = (action: () => void) => () => {
    action();
    ctx.close();
  };
  return [
    {
      value: 'zoom-in',
      label: 'Zoom in',
      keywords: ['in', 'bigger', 'larger', ...ZOOM_KEYWORDS],
      icon: 'arrow-narrow-up',
      tone: 'default',
      current: false,
      run: run(ctx.zoomIn),
    },
    {
      value: 'zoom-out',
      label: 'Zoom out',
      keywords: ['out', 'smaller', ...ZOOM_KEYWORDS],
      icon: 'arrow-narrow-down',
      tone: 'default',
      current: false,
      run: run(ctx.zoomOut),
    },
    {
      value: 'zoom-reset',
      label: 'Reset zoom',
      keywords: ['reset', 'default', 'actual size', '100%', ...ZOOM_KEYWORDS],
      icon: 'history-circle',
      tone: 'default',
      current: ctx.zoom === 1,
      run: run(ctx.resetZoom),
    },
  ];
}

export type AppearanceCommandContext = {
  theme: string;
  setTheme: (theme: NotaThemeChoice) => void;
  close: () => void;
};

const APPEARANCE_KEYWORDS = ['appearance', 'theme', 'color scheme', 'mode'];

/**
 * The three theme commands, previously three near-identical `Command.Item`
 * blocks differing only by label / icon / value / active check.
 */
export function buildAppearanceCommands(
  ctx: AppearanceCommandContext,
): PaletteActionCommand[] {
  const choose = (theme: NotaThemeChoice) => () => {
    ctx.setTheme(theme);
    ctx.close();
  };
  return [
    {
      value: 'use-light-theme',
      label: 'Use light theme',
      keywords: ['light', ...APPEARANCE_KEYWORDS],
      icon: 'bulb',
      tone: 'default',
      current: ctx.theme === 'light',
      run: choose('light'),
    },
    {
      value: 'use-dark-theme',
      label: 'Use dark theme',
      keywords: ['dark', ...APPEARANCE_KEYWORDS],
      icon: 'moon',
      tone: 'default',
      current: ctx.theme === 'dark',
      run: choose('dark'),
    },
    {
      value: 'use-system-theme',
      label: 'Use system theme',
      keywords: ['system', 'auto', 'os', 'default', ...APPEARANCE_KEYWORDS],
      icon: 'cpu',
      tone: 'default',
      current: ctx.theme === 'system',
      run: choose('system'),
    },
  ];
}
