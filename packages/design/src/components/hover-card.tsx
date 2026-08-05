/**
 * Hover card primitives built on Base UI Popover.
 *
 * @remarks
 * Import from the package subpath only:
 * `import { HoverCard, HoverCardTrigger, … } from '@nota/design/hover-card'`.
 * The trigger enables hover opening by default; popup is a styled Nota surface.
 *
 * @packageDocumentation
 */

import type { ComponentProps } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';

import { NOTA_POPUP_MOTION_CLASS } from '../lib/nota-popup-motion.js';
import { cn } from '../lib/utils.js';

export type HoverCardProps = ComponentProps<typeof BasePopover.Root>;
export type HoverCardTriggerProps = ComponentProps<typeof BasePopover.Trigger>;
export type HoverCardPortalProps = ComponentProps<typeof BasePopover.Portal>;
export type HoverCardPositionerProps = ComponentProps<
  typeof BasePopover.Positioner
>;
export type HoverCardPopupProps = ComponentProps<typeof BasePopover.Popup>;

const DEFAULT_HOVER_CARD_POPUP_CLASS = cn(
  'z-50 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none',
  NOTA_POPUP_MOTION_CLASS,
);

export const HoverCard = BasePopover.Root;
export const HoverCardPortal = BasePopover.Portal;
export const HoverCardPositioner = BasePopover.Positioner;

export function HoverCardTrigger({
  delay = 250,
  closeDelay = 120,
  openOnHover = true,
  ...props
}: HoverCardTriggerProps) {
  return (
    <BasePopover.Trigger
      delay={delay}
      closeDelay={closeDelay}
      openOnHover={openOnHover}
      {...props}
    />
  );
}

export function HoverCardPopup({
  className,
  initialFocus = false,
  finalFocus = false,
  ...props
}: HoverCardPopupProps) {
  return (
    <BasePopover.Popup
      initialFocus={initialFocus}
      finalFocus={finalFocus}
      className={cn(DEFAULT_HOVER_CARD_POPUP_CLASS, className)}
      {...props}
    />
  );
}
