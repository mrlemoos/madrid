/**
 * Composable card layout: themed container and slots for header, title, description, actions, body, and footer.
 *
 * @remarks
 * Import from the package subpath only: `import { NotaCard, NotaCardHeader, … } from '@nota/design/card'`.
 * Each part sets a stable `data-slot` (`card`, `card-header`, `card-title`, …) for styling and layout hooks. Parent `NotaCard` exposes `data-size` (`default` | `sm`) read by descendants via `group-data-[size=sm]/card`.
 *
 * @packageDocumentation
 */

import * as React from 'react';

import { cn } from '../lib/utils.js';

/** Root card props: standard `div` props plus compact `size`. */
export type NotaCardProps = React.ComponentProps<'div'> & {
  /** @defaultValue `'default'` */
  size?: 'default' | 'sm';
};
/** Props for {@link NotaCardHeader}. */
export type NotaCardHeaderProps = React.ComponentProps<'div'>;
/** Props for {@link NotaCardTitle}. */
export type NotaCardTitleProps = React.ComponentProps<'div'>;
/** Props for {@link NotaCardDescription}. */
export type NotaCardDescriptionProps = React.ComponentProps<'div'>;
/** Props for {@link NotaCardAction}. */
export type NotaCardActionProps = React.ComponentProps<'div'>;
/** Props for {@link NotaCardContent}. */
export type NotaCardContentProps = React.ComponentProps<'div'>;
/** Props for {@link NotaCardFooter}. */
export type NotaCardFooterProps = React.ComponentProps<'div'>;

/**
 * Card surface: flex column, theme tokens (`bg-card`, `text-card-foreground`), optional `sm` density.
 *
 * @remarks
 * `data-slot="card"`. First/last child images get rounded corners; first image removes top padding when first.
 *
 * @example
 * ```tsx
 * import {
 *   NotaCard,
 *   NotaCardHeader,
 *   NotaCardTitle,
 *   NotaCardDescription,
 *   NotaCardContent,
 * } from '@nota/design/card';
 *
 * export function Example() {
 *   return (
 *     <NotaCard size="sm">
 *       <NotaCardHeader>
 *         <NotaCardTitle>Title</NotaCardTitle>
 *         <NotaCardDescription>Subtitle</NotaCardDescription>
 *       </NotaCardHeader>
 *       <NotaCardContent>Body</NotaCardContent>
 *     </NotaCard>
 *   );
 * }
 * ```
 */
export function NotaCard({
  className,
  size = 'default',
  ...props
}: NotaCardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'group/card flex flex-col gap-4 overflow-hidden rounded-lg bg-card py-4 text-xs/relaxed text-card-foreground ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Top region: grid for title, optional description, and optional {@link NotaCardAction}.
 *
 * @remarks
 * `data-slot="card-header"`. Uses `@container/card-header` and adjusts padding when the parent card is `size="sm"`.
 */
export function NotaCardHeader({ className, ...props }: NotaCardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Card heading line (semantic `div`; use a heading element inside if you need document outline).
 *
 * @remarks
 * `data-slot="card-title"`. Uses `font-heading` and `text-sm font-medium`.
 */
export function NotaCardTitle({ className, ...props }: NotaCardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cn('font-heading text-sm font-medium', className)}
      {...props}
    />
  );
}

/**
 * Muted supporting text under the title.
 *
 * @remarks
 * `data-slot="card-description"`. When present, the header grid may use a second row for layout.
 */
export function NotaCardDescription({
  className,
  ...props
}: NotaCardDescriptionProps) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-xs/relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * Top-right slot in the header (e.g. menu or icon button).
 *
 * @remarks
 * `data-slot="card-action"`. Positioned in column 2 of the header grid when combined with title/description.
 */
export function NotaCardAction({ className, ...props }: NotaCardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Main padded body between header and footer.
 *
 * @remarks
 * `data-slot="card-content"`. Horizontal padding follows parent `size` (`px-4` vs `px-3` on `sm`).
 */
export function NotaCardContent({ className, ...props }: NotaCardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-4 group-data-[size=sm]/card:px-3', className)}
      {...props}
    />
  );
}

/**
 * Bottom actions row (e.g. buttons).
 *
 * @remarks
 * `data-slot="card-footer"`. Flex row with padding; top border utilities can add spacing via `[.border-t]:pt-*`.
 */
export function NotaCardFooter({ className, ...props }: NotaCardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center rounded-b-lg px-4 group-data-[size=sm]/card:px-3 [.border-t]:pt-4 group-data-[size=sm]/card:[.border-t]:pt-3',
        className,
      )}
      {...props}
    />
  );
}
