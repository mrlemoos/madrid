/**
 * Marketing chrome colours.
 *
 * The site runs its own warm palette (bone ground, near-black ink) rather than
 * the app's neutral greys, so the hex values live here instead of coming from
 * `@getmadrid/design/theme-color`. Keep in sync with `styles/global.css`.
 */

/** Light page ground: warm bone. Matches `:root` `--background-hex`. */
export const MKT_THEME_COLOR_PAGE = '#f4f1ea';

/** Dark bands (hero, footer): warm near-black. Matches `.mkt-dark` `--background-hex`. */
export const MKT_THEME_COLOR_HERO = '#12100e';

/** Primary `theme-color` meta id (Safari uses the unmediated tag). */
export const MKT_THEME_COLOR_META_ID = 'mkt-theme-color';

export type MktChromeScheme = 'light' | 'dark';

/** Maps a hex `theme-color` meta value to document `color-scheme`. */
export function chromeSchemeForThemeColor(themeColor: string): MktChromeScheme {
  return themeColor.toLowerCase() === MKT_THEME_COLOR_HERO ? 'dark' : 'light';
}
