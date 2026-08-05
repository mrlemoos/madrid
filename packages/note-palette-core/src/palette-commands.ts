import type { NotaIconName } from '@nota/design/icon';

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
  icon: NotaIconName;
  tone: 'default' | 'destructive';
  /** Shows a trailing "(current)" marker (e.g. the active theme). */
  current: boolean;
  run: () => void;
};

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
