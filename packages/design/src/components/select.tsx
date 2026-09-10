/** Base UI Select styled for Madrid. */

import type { ComponentProps } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';

import { cn } from '../lib/utils.js';

export type SelectProps = ComponentProps<typeof BaseSelect.Root>;
export type SelectTriggerProps = ComponentProps<typeof BaseSelect.Trigger>;
export type SelectValueProps = ComponentProps<typeof BaseSelect.Value>;
export type SelectItemProps = ComponentProps<typeof BaseSelect.Item>;

export const Select = BaseSelect.Root;

export function SelectTrigger({
  className,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      className={cn(
        'flex h-9 min-w-48 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon aria-hidden className="text-muted-foreground">
        ⌄
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export function SelectValue(props: SelectValueProps) {
  return <BaseSelect.Value {...props} />;
}

export function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Popup>) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={6} className="z-50">
        <BaseSelect.Popup
          className={cn(
            'min-w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg outline-none data-[ending-style]:duration-150',
            className,
          )}
          {...props}
        >
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
      className={cn(
        'flex cursor-default items-center justify-between gap-4 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator aria-hidden>✓</BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
