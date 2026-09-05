/**
 * Loading affordances: indeterminate spinner and labelled status row for async UI.
 *
 * @remarks
 * Import from the package subpath only: `import { Spinner, LoadingStatus } from '@getmadrid/design/spinner'`.
 * `Spinner` is decorative (`aria-hidden`); prefer {@link LoadingStatus} when screen readers should announce progress.
 *
 * @packageDocumentation
 */

import type { JSX, ReactNode } from 'react';

import { cn } from '../lib/utils.js';

const NOTA_SPINNER_SIZE_CLASS: Record<'sm' | 'md', string> = {
  sm: 'size-3.5 border-2',
  md: 'size-5 border-2',
};

/**
 * Props for {@link Spinner}.
 */
export type SpinnerProps = {
  /** Additional Tailwind / utility classes. */
  className?: string;
  /**
   * Visual diameter and border thickness preset.
   * @defaultValue `'md'`
   */
  size?: 'sm' | 'md';
};

/**
 * Indeterminate circular progress indicator (CSS spin).
 *
 * @remarks
 * Renders a `span` with `aria-hidden`; it does not expose an accessible name. Pair with visible copy or use {@link LoadingStatus} for `role="status"`.
 *
 * @example
 * ```tsx
 * import { Spinner } from '@getmadrid/design/spinner';
 *
 * export function Inline() {
 *   return <Spinner size="sm" />;
 * }
 * ```
 */
export function Spinner({ className, size = 'md' }: SpinnerProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-muted-foreground/20 border-t-muted-foreground/55',
        NOTA_SPINNER_SIZE_CLASS[size],
        className,
      )}
      aria-hidden
    />
  );
}

/**
 * Props for {@link LoadingStatus}.
 */
export type LoadingStatusProps = {
  /** Visible status text (string or node). */
  label: ReactNode;
  /** Wrapper classes for the flex row. */
  className?: string;
  /**
   * Spinner size passed to {@link Spinner}.
   * @defaultValue `'md'`
   */
  spinnerSize?: 'sm' | 'md';
};

/**
 * Spinner plus label in a polite live region for loading and empty-state messaging.
 *
 * @remarks
 * Container has `role="status"` and `aria-live="polite"`. The inner spinner remains `aria-hidden` to avoid duplicate announcements.
 *
 * @example
 * ```tsx
 * import { LoadingStatus } from '@getmadrid/design/spinner';
 *
 * export function LoadingNotes() {
 *   return <LoadingStatus label="Loading notes…" spinnerSize="sm" />;
 * }
 * ```
 */
export function LoadingStatus({
  label,
  className,
  spinnerSize = 'md',
}: LoadingStatusProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-sm text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size={spinnerSize} />
      <span>{label}</span>
    </div>
  );
}
