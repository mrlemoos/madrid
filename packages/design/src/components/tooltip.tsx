/**
 * Tooltip primitives built on Base UI: provider, root, trigger, portal, positioner, and a styled popup wrapper.
 *
 * @remarks
 * Import from the package subpath only: `import { Tooltip, TooltipTrigger, … } from '@getmadrid/design/tooltip'`.
 * Wrap subtrees that contain tooltips with {@link TooltipProvider} (or a single provider at app shell). {@link TooltipPopup} is the only export that applies Madrid surface styles; {@link Tooltip}, {@link TooltipTrigger}, {@link TooltipPortal}, and {@link TooltipPositioner} are thin re-exports of Base UI parts.
 *
 * @packageDocumentation
 */

import type { ComponentProps, ReactNode } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

import { NOTA_TOOLTIP_MOTION_CLASS } from '../lib/nota-popup-motion.js';
import { cn } from '../lib/utils.js';

/** Props for {@link TooltipProvider}. */
export type TooltipProviderProps = {
  children: ReactNode;
  /**
   * Show delay in milliseconds for tooltips inside this provider.
   * @defaultValue `250`
   */
  delay?: number;
};

/** Props for {@link Tooltip} (Base UI `Tooltip.Root`). */
export type TooltipProps = ComponentProps<typeof BaseTooltip.Root>;
/** Props for {@link TooltipTrigger}. */
export type TooltipTriggerProps = ComponentProps<typeof BaseTooltip.Trigger>;
/** Props for {@link TooltipPortal}. */
export type TooltipPortalProps = ComponentProps<typeof BaseTooltip.Portal>;
/** Props for {@link TooltipPositioner}. */
export type TooltipPositionerProps = ComponentProps<
  typeof BaseTooltip.Positioner
>;
/** Props for {@link TooltipPopup} (Base UI `Tooltip.Popup` + merged classes). */
export type TooltipPopupProps = ComponentProps<typeof BaseTooltip.Popup>;

const DEFAULT_NOTA_TOOLTIP_POPUP_CLASS = cn(
  'max-w-xs rounded-md border border-border bg-popover px-2 py-1',
  'text-popover-foreground text-xs shadow-md',
  NOTA_TOOLTIP_MOTION_CLASS,
);

/**
 * Tooltip root: open state, anchoring, and a11y wiring (Base UI `Tooltip.Root`).
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export const Tooltip = BaseTooltip.Root;

/**
 * Element that receives focus/hover to open the tooltip (Base UI `Tooltip.Trigger`).
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export const TooltipTrigger = BaseTooltip.Trigger;

/**
 * Renders tooltip parts into a portal subtree (Base UI `Tooltip.Portal`).
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export const TooltipPortal = BaseTooltip.Portal;

/**
 * Positions the popup relative to the trigger (Base UI `Tooltip.Positioner`).
 *
 * @remarks
 * Applies `z-50` on the positioner (same layer as dialogs / context menus) so
 * portaled tips stack above shell chrome that creates its own stacking context
 * (e.g. notes sidebar `backdrop-filter` / Electron `z-[35]`).
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export function TooltipPositioner({
  className,
  ref,
  ...props
}: TooltipPositionerProps) {
  return (
    <BaseTooltip.Positioner
      ref={ref}
      className={cn('z-50', className)}
      {...props}
    />
  );
}

/**
 * Scoped delay provider for nested tooltips.
 *
 * @example
 * ```tsx
 * import {
 *   TooltipProvider,
 *   Tooltip,
 *   TooltipTrigger,
 *   TooltipPortal,
 *   TooltipPositioner,
 *   TooltipPopup,
 * } from '@getmadrid/design/tooltip';
 *
 * export function HelpTip() {
 *   return (
 *     <TooltipProvider delay={300}>
 *       <Tooltip>
 *         <TooltipTrigger>Hover me</TooltipTrigger>
 *         <TooltipPortal>
 *           <TooltipPositioner sideOffset={6}>
 *             <TooltipPopup>Helpful text</TooltipPopup>
 *           </TooltipPositioner>
 *         </TooltipPortal>
 *       </Tooltip>
 *     </TooltipProvider>
 *   );
 * }
 * ```
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export function TooltipProvider({
  children,
  delay = 250,
}: TooltipProviderProps) {
  return <BaseTooltip.Provider delay={delay}>{children}</BaseTooltip.Provider>;
}

/**
 * Tooltip surface with Madrid popover styling (`border-border`, `bg-popover`, typography).
 *
 * @remarks
 * Merges `className` after the package default surface. For unstyled popups, use Base UI `Tooltip.Popup` directly instead.
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export function TooltipPopup({ className, ref, ...props }: TooltipPopupProps) {
  return (
    <BaseTooltip.Popup
      ref={ref}
      className={cn(DEFAULT_NOTA_TOOLTIP_POPUP_CLASS, className)}
      {...props}
    />
  );
}
