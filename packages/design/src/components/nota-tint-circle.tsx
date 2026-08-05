import type { ComponentProps } from 'react';

import { cn } from '../lib/utils.js';

const DEFAULT_SIZE_PX = 16;

export type NotaTintCircleProps = {
  /** CSS colour (e.g. `oklch(...)` or `#hex`). */
  colour: string;
  /** Pixel diameter; default 16. */
  sizePx?: number;
} & Pick<ComponentProps<'span'>, 'className' | 'aria-label'>;

/**
 * Filled circle for colour swatches (menu, command palette, folder tint).
 * Pass `aria-label` when the control is unlabelled visually.
 */
export function NotaTintCircle({
  colour,
  sizePx = DEFAULT_SIZE_PX,
  className,
  'aria-label': ariaLabel,
  ...rest
}: NotaTintCircleProps) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full border border-border/50 ring-offset-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        className,
      )}
      style={{
        width: sizePx,
        height: sizePx,
        backgroundColor: colour,
      }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      {...rest}
    />
  );
}
