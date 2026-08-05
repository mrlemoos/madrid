/**
 * Composable card layout: themed container and slots for header, title, description, actions, body, and footer.
 *
 * @remarks
 * Import from the package subpath only: `import { Card, CardHeader, … } from '@nota/design/card'`.
 * Each part sets a stable `data-slot` (`card`, `card-header`, `card-title`, …) for styling and layout hooks. Parent `Card` exposes `data-size` (`default` | `sm`) read by descendants via `group-data-[size=sm]/card`.
 *
 * @packageDocumentation
 */

import * as React from 'react';

import { cn } from '../lib/utils.js';

/** Root card props: standard `div` props plus compact `size`. */
export type CardProps = React.ComponentProps<'div'> & {
  /** @defaultValue `'default'` */
  size?: 'default' | 'sm';
};
/** Props for {@link CardHeader}. */
export type CardHeaderProps = React.ComponentProps<'div'>;
/** Props for {@link CardTitle}. */
export type CardTitleProps = React.ComponentProps<'div'>;
/** Props for {@link CardDescription}. */
export type CardDescriptionProps = React.ComponentProps<'div'>;
/** Props for {@link CardAction}. */
export type CardActionProps = React.ComponentProps<'div'>;
/** Props for {@link CardContent}. */
export type CardContentProps = React.ComponentProps<'div'>;
/** Props for {@link CardFooter}. */
export type CardFooterProps = React.ComponentProps<'div'>;

/**
 * Card surface: flex column, theme tokens (`bg-card`, `text-card-foreground`), optional `sm` density.
 *
 * @remarks
 * `data-slot="card"`. First/last child images get rounded corners; first image removes top padding when first.
 *
 * @example
 * ```tsx
 * import {
 *   Card,
 *   CardHeader,
 *   CardTitle,
 *   CardDescription,
 *   CardContent,
 * } from '@nota/design/card';
 *
 * export function Example() {
 *   return (
 *     <Card size="sm">
 *       <CardHeader>
 *         <CardTitle>Title</CardTitle>
 *         <CardDescription>Subtitle</CardDescription>
 *       </CardHeader>
 *       <CardContent>Body</CardContent>
 *     </Card>
 *   );
 * }
 * ```
 */
export function Card({ className, size = 'default', ...props }: CardProps) {
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
 * Top region: grid for title, optional description, and optional {@link CardAction}.
 *
 * @remarks
 * `data-slot="card-header"`. Uses `@container/card-header` and adjusts padding when the parent card is `size="sm"`.
 */
export function CardHeader({ className, ...props }: CardHeaderProps) {
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
export function CardTitle({ className, ...props }: CardTitleProps) {
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
export function CardDescription({ className, ...props }: CardDescriptionProps) {
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
export function CardAction({ className, ...props }: CardActionProps) {
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
export function CardContent({ className, ...props }: CardContentProps) {
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
export function CardFooter({ className, ...props }: CardFooterProps) {
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
