import type { JSX, ReactNode } from 'react';
import {
  NotaCard,
  NotaCardContent,
  NotaCardFooter,
  NotaCardHeader,
} from '@nota/web-design/card';
import { AuthCardEpigraph } from '@/components/auth-card-epigraph';
import { CartoonLandscape } from '@/components/cartoon-landscape';
import { useIsElectron } from '@nota/electron-bridge-ui/use-is-electron';
import { cn } from '@/lib/utils';

/** Drag band height in `electron-window-drag-band.tsx` — half used to optically centre the card. */
const electronAuthTopPadding =
  'pt-[max(calc(2rem+26px),calc(52px+env(safe-area-inset-top,0px)))]' as const;

export function AuthScreenShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}): JSX.Element {
  const isElectron = useIsElectron();

  return (
    <main
      id="main-content"
      className={cn(
        'relative isolate flex min-h-0 flex-1 h-dvh w-full items-center justify-center overflow-y-auto',
        'px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]',
        isElectron
          ? electronAuthTopPadding
          : 'pt-[max(2rem,env(safe-area-inset-top))]',
      )}
    >
      <div className="absolute inset-0 z-0">
        <CartoonLandscape className="size-full" />
      </div>

      <div className="nota-auth-card-enter relative z-10 w-full max-w-md">
        <NotaCard
          className={cn(
            'border-border/50 bg-background/70 shadow-lg backdrop-blur-xl ring-1 ring-border/40',
          )}
        >
          <NotaCardHeader className="pb-0 text-center">
            <AuthCardEpigraph />
          </NotaCardHeader>
          <NotaCardContent className="pt-0">
            <div className="nota-auth-form-slot w-full border-t border-border/40 pt-5">
              {children}
            </div>
          </NotaCardContent>
          <NotaCardFooter className="justify-center border-t border-border/40 pt-4">
            <p className="text-center text-muted-foreground text-xs/relaxed">
              {footer}
            </p>
          </NotaCardFooter>
        </NotaCard>
      </div>
    </main>
  );
}
