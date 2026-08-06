import type { RefObject } from 'react';
import { cn } from '@nota/design/utils';

export type NotePdfThumbnailPhase = 'loading' | 'ready' | 'error';

export function NotePdfThumbnailFrame({
  phase,
  canvasRef,
}: {
  phase: NotePdfThumbnailPhase;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <div data-testid="note-pdf-thumbnail" className="absolute inset-0 p-2">
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          'absolute inset-2 block rounded-xl bg-background transition-opacity duration-200',
          phase === 'ready' ? 'h-full w-full opacity-100' : 'opacity-0',
        )}
      />
      {phase === 'ready' ? null : (
        <div
          className={cn(
            'absolute inset-2 flex items-center justify-center rounded-xl',
            phase === 'error'
              ? 'border border-border/80 bg-background shadow-sm'
              : 'border border-dashed border-border/60 bg-muted/20',
          )}
        >
          {phase === 'error' ? (
            <span
              data-testid="note-pdf-thumbnail-placeholder"
              className="text-lg font-semibold tracking-wide text-muted-foreground"
            >
              PDF
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Loading preview…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
