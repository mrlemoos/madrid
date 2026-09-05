/**
 * Tailwind-friendly class name merging for `@getmadrid/design` and app re-exports.
 *
 * @remarks
 * Import from the package subpath only: `import { cn, type ClassValue } from '@getmadrid/design/utils'`.
 * {@link cn} composes conditional classes with `clsx` then deduplicates / merges Tailwind utilities with `tailwind-merge`.
 *
 * @packageDocumentation
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Re-export of `clsx` input types: strings, objects, arrays, falsy guards.
 *
 * @see {@link https://github.com/lukeed/clsx#readme | clsx}
 */
export type { ClassValue };

/**
 * Merge class names for a single `className` prop (clsx + tailwind-merge).
 *
 * @param inputs - Any values accepted by `clsx` (strings, objects, arrays, booleans).
 * @returns Single string safe to pass to React `className` or DOM `classList`.
 *
 * @example
 * ```tsx
 * import { cn } from '@getmadrid/design/utils';
 *
 * const className = cn('px-2 py-1', isActive && 'bg-muted', classNameFromProps);
 * ```
 *
 * @see {@link https://github.com/dcastil/tailwind-merge#readme | tailwind-merge}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
