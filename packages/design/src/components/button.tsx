/**
 * Nota button primitives: Base UI `Button` with CVA styling and theme tokens.
 *
 * @remarks
 * Import from the package subpath only: `import { Button, buttonVariants } from '@nota/design/button'`.
 * Styling uses semantic Tailwind tokens (`bg-primary`, `border-border`, `ring-ring`, …) so callers should set CSS variables / theme, not hard-coded neutrals.
 *
 * @packageDocumentation
 */

import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils.js';

/**
 * Class variance authority helper for Nota button appearance.
 *
 * @remarks
 * Use for non-`button` elements that should match `Button` (e.g. custom `as` patterns), or to merge variant classes with `cn`.
 * Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
 *
 * @example
 * ```tsx
 * import { buttonVariants } from '@nota/design/button';
 *
 * const className = buttonVariants({ variant: 'outline', size: 'sm' });
 * ```
 *
 * @see {@link https://base-ui.com/react/components/button | Base UI Button}
 */
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap outline-none select-none transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-[160ms] ease-out motion-safe:active:scale-[0.97] motion-safe:active:duration-[100ms] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        /** Flat shaded pill: fill one step off the page surface, no border, no gradient. */
        shaded:
          'rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-xs': "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        'icon-sm': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-lg': "size-8 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

/**
 * Props for {@link Button}: Base UI button props (except `ref` merged separately), CVA variant/size, and ref.
 *
 * @remarks
 * Inherits behaviour and a11y from `@base-ui/react/button` (native `button` semantics unless overridden by the renderer).
 */
export type ButtonProps = Omit<BaseButton.Props, 'ref'> &
  VariantProps<typeof buttonVariants> &
  React.RefAttributes<HTMLElement>;

/**
 * Primary action control: Base UI `Button` with Nota variants and `data-slot="button"`.
 *
 * @remarks
 * `className` is merged with {@link buttonVariants}; `variant` and `size` default to `'default'`.
 *
 * @example
 * ```tsx
 * import { Button } from '@nota/design/button';
 *
 * export function Save() {
 *   return <Button type="submit">Save</Button>;
 * }
 * ```
 *
 * @see {@link https://base-ui.com/react/components/button | Base UI Button}
 */
export function Button({
  ref,
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

Button.displayName = 'Button';
