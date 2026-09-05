'use client';

import type { JSX, ReactNode } from 'react';
import { ElectronWindowDragBand } from '@getmadrid/electron-bridge-ui/window-drag-band';
import { electronWindowDragClasses } from '@getmadrid/electron-bridge-core/window-chrome';
import { useIsElectron } from '@getmadrid/electron-bridge-ui/use-is-electron';
import { AuthLandscapeEpigraph } from '@/components/auth-landscape-epigraph';
import { CartoonLandscape } from '@/components/cartoon-landscape';
import { cn } from '@/lib/utils';

/** Drag band height in `electron-window-drag-band.tsx`. */
const electronAuthTopPadding =
  'pt-[max(calc(2rem+26px),calc(52px+env(safe-area-inset-top,0px)))]' as const;

/** Opaque form surface — painting does not show through. Landing has no card. */
export const signedOutCardClass =
  'border-border bg-background shadow-lg ring-1 ring-border/30';

/**
 * Shared signed-out chrome: unwashed landscape, brand line on the painting,
 * Electron drag (painting + title-bar band), content slot (form card or CTA).
 */
export function SignedOutStage({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}): JSX.Element {
  const isElectron = useIsElectron();
  const { drag, noDrag } = electronWindowDragClasses();

  return (
    <main
      id="main-content"
      className={cn(
        'relative isolate flex min-h-0 flex-1 h-dvh w-full items-center justify-center overflow-y-auto',
        'px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]',
        isElectron
          ? electronAuthTopPadding
          : 'pt-[max(2rem,env(safe-area-inset-top))]',
        className,
      )}
    >
      <ElectronWindowDragBand />
      <div className="absolute inset-0 z-0">
        <CartoonLandscape className="size-full" />
      </div>
      {isElectron ? (
        <div
          aria-hidden
          className={cn(
            drag,
            'pointer-events-auto absolute inset-0 left-20 z-[5]',
          )}
        />
      ) : null}
      <div
        className={cn(
          'pointer-events-none absolute z-[15] max-w-[min(100%,28rem)] px-4',
          'top-[max(1.25rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))]',
          isElectron &&
            'top-[max(calc(52px+0.75rem),calc(52px+env(safe-area-inset-top)))] left-20',
        )}
      >
        <AuthLandscapeEpigraph />
      </div>
      <div
        className={cn(
          'relative z-10 w-full max-w-md',
          noDrag,
          contentClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}
