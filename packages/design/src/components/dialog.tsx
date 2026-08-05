/**
 * Dialog primitives built on Base UI Dialog (shadcn base-mira shape).
 *
 * @remarks
 * Import from the package subpath only:
 * `import { NotaDialog, NotaDialogContent, … } from '@nota/design/dialog'`.
 * {@link NotaDialogContent} portals the overlay + popup with Nota surface styles
 * and {@link NOTA_DIALOG_MOTION_CLASS}.
 *
 * @packageDocumentation
 */

import type { ComponentProps, ReactNode } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

import { NotaButton } from './button.js';
import { NOTA_DIALOG_MOTION_CLASS } from '../lib/nota-popup-motion.js';
import { cn } from '../lib/utils.js';

export type NotaDialogProps = ComponentProps<typeof DialogPrimitive.Root>;
export type NotaDialogTriggerProps = ComponentProps<
  typeof DialogPrimitive.Trigger
>;
export type NotaDialogPortalProps = ComponentProps<
  typeof DialogPrimitive.Portal
>;
export type NotaDialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
export type NotaDialogOverlayProps = ComponentProps<
  typeof DialogPrimitive.Backdrop
>;
export type NotaDialogPopupProps = ComponentProps<typeof DialogPrimitive.Popup>;
export type NotaDialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;
export type NotaDialogDescriptionProps = ComponentProps<
  typeof DialogPrimitive.Description
>;

const DEFAULT_OVERLAY_CLASS = cn(
  'fixed inset-0 z-50 bg-black/40 transition-opacity duration-150',
  'data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
);

const DEFAULT_CONTENT_CLASS = cn(
  'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4',
  'rounded-lg border border-border/60 bg-background p-4 text-foreground shadow-lg outline-none sm:max-w-sm',
  NOTA_DIALOG_MOTION_CLASS,
);

/**
 * Dialog root (open state + a11y wiring).
 *
 * @see {@link https://base-ui.com/react/components/dialog | Base UI Dialog}
 */
export const NotaDialog = DialogPrimitive.Root;

/** Button that opens the dialog. */
export const NotaDialogTrigger = DialogPrimitive.Trigger;

/** Portal for overlay + popup. */
export const NotaDialogPortal = DialogPrimitive.Portal;

/** Closes the dialog when activated. */
export const NotaDialogClose = DialogPrimitive.Close;

/**
 * Dimmed backdrop behind the popup.
 */
export function NotaDialogOverlay({
  className,
  ...props
}: NotaDialogOverlayProps) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(DEFAULT_OVERLAY_CLASS, className)}
      {...props}
    />
  );
}

export type NotaDialogContentProps = NotaDialogPopupProps & {
  /** When true, render a ghost icon close control in the top-right. @defaultValue true */
  showCloseButton?: boolean;
};

/**
 * Portaled overlay + popup surface. Pass `className` to override size/position.
 */
export function NotaDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: NotaDialogContentProps) {
  return (
    <NotaDialogPortal>
      <NotaDialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(DEFAULT_CONTENT_CLASS, className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <NotaButton
                variant="ghost"
                size="icon-sm"
                className="absolute top-2 right-2"
                aria-label="Close"
              />
            }
          >
            <CloseGlyph />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </NotaDialogPortal>
  );
}

export function NotaDialogHeader({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  );
}

export type NotaDialogFooterProps = ComponentProps<'div'> & {
  showCloseButton?: boolean;
};

export function NotaDialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: NotaDialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close
          render={<NotaButton variant="outline" size="sm" />}
        >
          Close
        </DialogPrimitive.Close>
      ) : null}
    </div>
  );
}

export function NotaDialogTitle({ className, ...props }: NotaDialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
}

export function NotaDialogDescription({
  className,
  ...props
}: NotaDialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-xs/relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

function CloseGlyph(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3.5"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
