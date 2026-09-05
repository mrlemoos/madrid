/**
 * Context menu primitives built on Base UI: root, trigger, portal, positioner,
 * popup, item, separator, and submenu helpers.
 *
 * @remarks
 * Import from the package subpath only: `import { ContextMenu, … } from '@getmadrid/design/context-menu'`.
 * `ContextMenuPopup` and the item wrappers apply Madrid surface styling; the other exports are thin re-exports of Base UI parts.
 *
 * @packageDocumentation
 */

import type { ComponentProps } from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { Menu as BaseMenu } from '@base-ui/react/menu';

import { NOTA_POPUP_MOTION_CLASS } from '../lib/nota-popup-motion.js';
import { cn } from '../lib/utils.js';

export type ContextMenuProps = ComponentProps<typeof BaseContextMenu.Root>;
export type ContextMenuTriggerProps = ComponentProps<
  typeof BaseContextMenu.Trigger
>;
export type ContextMenuPortalProps = ComponentProps<
  typeof BaseContextMenu.Portal
>;
export type ContextMenuPositionerProps = ComponentProps<
  typeof BaseContextMenu.Positioner
>;
export type ContextMenuPopupProps = ComponentProps<
  typeof BaseContextMenu.Popup
>;
export type ContextMenuViewportProps = ComponentProps<typeof BaseMenu.Viewport>;
export type ContextMenuItemProps = ComponentProps<typeof BaseContextMenu.Item>;
export type ContextMenuSeparatorProps = ComponentProps<
  typeof BaseContextMenu.Separator
>;
export type ContextMenuSubmenuRootProps = ComponentProps<
  typeof BaseContextMenu.SubmenuRoot
>;
export type ContextMenuSubmenuTriggerProps = ComponentProps<
  typeof BaseContextMenu.SubmenuTrigger
>;
export type ContextMenuRadioGroupProps = ComponentProps<
  typeof BaseContextMenu.RadioGroup
>;
export type ContextMenuRadioItemProps = ComponentProps<
  typeof BaseContextMenu.RadioItem
>;
export type ContextMenuRadioItemIndicatorProps = ComponentProps<
  typeof BaseContextMenu.RadioItemIndicator
>;

const DEFAULT_CONTEXT_MENU_POPUP_CLASS = cn(
  'z-50 min-w-48 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md',
  NOTA_POPUP_MOTION_CLASS,
);

const DEFAULT_CONTEXT_MENU_VIEWPORT_CLASS = cn(
  'max-h-[min(20rem,calc(100vh-2rem))] overflow-y-auto overscroll-contain',
);

const DEFAULT_CONTEXT_MENU_ITEM_CLASS = cn(
  'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none',
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
);

const DEFAULT_CONTEXT_MENU_SUBMENU_TRIGGER_CLASS = cn(
  DEFAULT_CONTEXT_MENU_ITEM_CLASS,
  'justify-between',
);

const DEFAULT_CONTEXT_MENU_SEPARATOR_CLASS = 'my-1 h-px bg-border/70';

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const ContextMenu = BaseContextMenu.Root;
export const ContextMenuTrigger = BaseContextMenu.Trigger;
export const ContextMenuPortal = BaseContextMenu.Portal;
export const ContextMenuSubmenuRoot = BaseContextMenu.SubmenuRoot;
export const ContextMenuRadioGroup = BaseContextMenu.RadioGroup;
export const ContextMenuRadioItem = BaseContextMenu.RadioItem;
export const ContextMenuRadioItemIndicator = BaseContextMenu.RadioItemIndicator;

export function ContextMenuPositioner({
  className,
  ref,
  ...props
}: ContextMenuPositionerProps) {
  return (
    <BaseContextMenu.Positioner
      ref={ref}
      className={cn('z-50', className)}
      {...props}
    />
  );
}

export function ContextMenuViewport({
  className,
  ref,
  ...props
}: ContextMenuViewportProps) {
  return (
    <BaseMenu.Viewport
      ref={ref}
      className={cn(DEFAULT_CONTEXT_MENU_VIEWPORT_CLASS, className)}
      {...props}
    />
  );
}

export function ContextMenuPopup({
  className,
  ref,
  ...props
}: ContextMenuPopupProps) {
  return (
    <BaseContextMenu.Popup
      ref={ref}
      className={cn(DEFAULT_CONTEXT_MENU_POPUP_CLASS, className)}
      {...props}
    />
  );
}

export function ContextMenuItem({ className, ...props }: ContextMenuItemProps) {
  return (
    <BaseContextMenu.Item
      className={cn(DEFAULT_CONTEXT_MENU_ITEM_CLASS, className)}
      {...props}
    />
  );
}

export function ContextMenuSubmenuTrigger({
  className,
  ...props
}: ContextMenuSubmenuTriggerProps) {
  return (
    <BaseContextMenu.SubmenuTrigger
      className={cn(DEFAULT_CONTEXT_MENU_SUBMENU_TRIGGER_CLASS, className)}
      {...props}
    />
  );
}

export function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuSeparatorProps) {
  return (
    <BaseContextMenu.Separator
      className={cn(DEFAULT_CONTEXT_MENU_SEPARATOR_CLASS, className)}
      {...props}
    />
  );
}
