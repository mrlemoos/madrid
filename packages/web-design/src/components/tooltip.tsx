/**
 * Tooltip primitives built on Base UI: provider, root, trigger, portal, positioner, and a styled popup wrapper.
 *
 * @remarks
 * Import from the package subpath only: `import { NotaTooltip, NotaTooltipTrigger, … } from '@nota/web-design/tooltip'`.
 * Wrap subtrees that contain tooltips with {@link NotaTooltipProvider} (or a single provider at app shell). {@link NotaTooltipPopup} is the only export that applies Nota surface styles; {@link NotaTooltip}, {@link NotaTooltipTrigger}, {@link NotaTooltipPortal}, and {@link NotaTooltipPositioner} are thin re-exports of Base UI parts.
 *
 * @packageDocumentation
 */

import type { ComponentProps, ReactNode } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

import { NOTA_TOOLTIP_MOTION_CLASS } from '../lib/nota-popup-motion.js';
import { cn } from '../lib/utils.js';

/** Props for {@link NotaTooltipProvider}. */
export type NotaTooltipProviderProps = {
  children: ReactNode;
  /**
   * Show delay in milliseconds for tooltips inside this provider.
   * @defaultValue `250`
   */
  delay?: number;
};

/** Props for {@link NotaTooltip} (Base UI `Tooltip.Root`). */
export type NotaTooltipProps = ComponentProps<typeof BaseTooltip.Root>;
/** Props for {@link NotaTooltipTrigger}. */
export type NotaTooltipTriggerProps = ComponentProps<
  typeof BaseTooltip.Trigger
>;
/** Props for {@link NotaTooltipPortal}. */
export type NotaTooltipPortalProps = ComponentProps<typeof BaseTooltip.Portal>;
/** Props for {@link NotaTooltipPositioner}. */
export type NotaTooltipPositionerProps = ComponentProps<
  typeof BaseTooltip.Positioner
>;
/** Props for {@link NotaTooltipPopup} (Base UI `Tooltip.Popup` + merged classes). */
export type NotaTooltipPopupProps = ComponentProps<typeof BaseTooltip.Popup>;

const DEFAULT_NOTA_TOOLTIP_POPUP_CLASS = cn(
  'z-100 max-w-xs rounded-md border border-border bg-popover px-2 py-1',
  'text-popover-foreground text-xs shadow-md',
  NOTA_TOOLTIP_MOTION_CLASS,
);

/**
 * Tooltip root: open state, anchoring, and a11y wiring (Base UI `Tooltip.Root`).
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export const NotaTooltip = BaseTooltip.Root;

/**
 * Element that receives focus/hover to open the tooltip (Base UI `Tooltip.Trigger`).
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export const NotaTooltipTrigger = BaseTooltip.Trigger;

/**
 * Renders tooltip parts into a portal subtree (Base UI `Tooltip.Portal`).
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export const NotaTooltipPortal = BaseTooltip.Portal;

/**
 * Positions the popup relative to the trigger (Base UI `Tooltip.Positioner`).
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export const NotaTooltipPositioner = BaseTooltip.Positioner;

/**
 * Scoped delay provider for nested tooltips.
 *
 * @example
 * ```tsx
 * import {
 *   NotaTooltipProvider,
 *   NotaTooltip,
 *   NotaTooltipTrigger,
 *   NotaTooltipPortal,
 *   NotaTooltipPositioner,
 *   NotaTooltipPopup,
 * } from '@nota/web-design/tooltip';
 *
 * export function HelpTip() {
 *   return (
 *     <NotaTooltipProvider delay={300}>
 *       <NotaTooltip>
 *         <NotaTooltipTrigger>Hover me</NotaTooltipTrigger>
 *         <NotaTooltipPortal>
 *           <NotaTooltipPositioner sideOffset={6}>
 *             <NotaTooltipPopup>Helpful text</NotaTooltipPopup>
 *           </NotaTooltipPositioner>
 *         </NotaTooltipPortal>
 *       </NotaTooltip>
 *     </NotaTooltipProvider>
 *   );
 * }
 * ```
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export function NotaTooltipProvider({
  children,
  delay = 250,
}: NotaTooltipProviderProps) {
  return <BaseTooltip.Provider delay={delay}>{children}</BaseTooltip.Provider>;
}

/**
 * Tooltip surface with Nota popover styling (`border-border`, `bg-popover`, typography).
 *
 * @remarks
 * Merges `className` after the package default surface. For unstyled popups, use Base UI `Tooltip.Popup` directly instead.
 *
 * @see {@link https://base-ui.com/react/components/tooltip | Base UI Tooltip}
 */
export function NotaTooltipPopup({
  className,
  ref,
  ...props
}: NotaTooltipPopupProps) {
  return (
    <BaseTooltip.Popup
      ref={ref}
      className={cn(DEFAULT_NOTA_TOOLTIP_POPUP_CLASS, className)}
      {...props}
    />
  );
}
