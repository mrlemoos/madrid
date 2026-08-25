import { cn } from '@/lib/utils';

type CartoonLandscapeProps = {
  className?: string;
};

/**
 * Welcome Landscape: full-bleed painting behind welcome/auth cards.
 * Contrast for type lives on the headline scrim, not a wash over the image.
 */
export function CartoonLandscape({ className }: CartoonLandscapeProps) {
  return (
    <div
      className={cn('relative pointer-events-none overflow-hidden', className)}
      aria-hidden="true"
    >
      <img
        src="/nota-landscape.png"
        alt=""
        className="absolute inset-0 size-full min-h-full min-w-full object-cover object-bottom select-none"
        draggable={false}
      />
    </div>
  );
}
