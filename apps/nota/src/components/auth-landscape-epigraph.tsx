import type { JSX } from 'react';
import { cn } from '@/lib/utils';
import { bricolageGrotesqueStyle } from '@/components/bricolage-grotesque';

/**
 * Brand line over the signed-out landscape. Type sits on the painting — no plate.
 * Used on `/`, `/signin`, and `/signup`.
 */
export function AuthLandscapeEpigraph({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <div className={cn('max-w-md text-left', className)}>
      <h1
        className="text-balance text-3xl font-medium leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-4xl"
        style={bricolageGrotesqueStyle}
      >
        Think clearly. Write slowly.
      </h1>
      <p className="mt-2 text-pretty text-sm/relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
        A quiet space for your thoughts, away from the noise.
      </p>
    </div>
  );
}
