/** Media query: hover motion only on fine pointers with hover capability. */
export const NOTA_ICON_HOVER_MEDIA = '(hover: hover) and (pointer: fine)';

type MatchMedia = (query: string) => Pick<MediaQueryList, 'matches'>;

/**
 * Whether decorative icon hover motion may run.
 *
 * @remarks
 * Requires fine pointer + hover capability, and no `prefers-reduced-motion: reduce`.
 */
export function canRunIconHoverMotion(
  matchMedia: MatchMedia = typeof window !== 'undefined'
    ? (q) => window.matchMedia(q)
    : () => ({ matches: false }),
): boolean {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  return matchMedia(NOTA_ICON_HOVER_MEDIA).matches;
}

/**
 * Wrap an icon hover handler so it no-ops when hover motion is gated off.
 *
 * @remarks
 * Returns `void` even for async handlers: these are pointer event handlers, so
 * nothing can await them, and handing a promise back would make every call site
 * a floating promise.
 */
export function gateIconHover(
  run: () => void | Promise<void>,
  matchMedia?: MatchMedia,
): () => void {
  return () => {
    if (!canRunIconHoverMotion(matchMedia)) {
      return;
    }
    void run();
  };
}
