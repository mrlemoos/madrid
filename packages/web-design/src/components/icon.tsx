/**
 * Nota icon wrapper: drop-in replacement for HugeiconsIcon over itshover animated icons.
 *
 * @remarks
 * Import from the package subpath only: `import { NotaIcon } from '@nota/web-design/icon'`.
 * Pass an itshover icon component via `icon`. Icons live under `@nota/web-design/icons`.
 *
 * @packageDocumentation
 */

import type {
  ForwardRefExoticComponent,
  HTMLAttributes,
  JSX,
  RefAttributes,
} from 'react';

import type { AnimatedIconHandle, AnimatedIconProps } from '../icons/types.js';
import { cn } from '../lib/utils.js';

/**
 * An itshover animated icon component (forwardRef + hover motion).
 */
export type NotaAnimatedIcon = ForwardRefExoticComponent<
  AnimatedIconProps & RefAttributes<AnimatedIconHandle>
>;

/**
 * Props for {@link NotaIcon}.
 */
export type NotaIconProps = HTMLAttributes<HTMLSpanElement> & {
  /** itshover icon component to render */
  icon: NotaAnimatedIcon;
  /** Pixel size passed to the icon */
  size?: number;
  /** Stroke width passed to the icon */
  strokeWidth?: number;
  /** Icon colour (defaults to currentColor inside the icon) */
  color?: string;
};

/**
 * Renders an itshover icon with normalised size, stroke, and class props.
 *
 * @remarks
 * Layout, colour, rotation, and `data-*` attributes apply to the outer span so
 * itshover icons keep their internal motion root unchanged.
 *
 * @example
 * ```tsx
 * import { NotaIcon } from '@nota/web-design/icon';
 * import { ArrowNarrowRightIcon } from '@nota/web-design/icons';
 *
 * <NotaIcon icon={ArrowNarrowRightIcon} size={16} className="text-muted-foreground" />
 * ```
 */
export function NotaIcon({
  icon: Icon,
  size = 24,
  className,
  color,
  strokeWidth,
  ...rest
}: NotaIconProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        className,
      )}
      {...rest}
    >
      <Icon size={size} color={color} strokeWidth={strokeWidth} />
    </span>
  );
}
