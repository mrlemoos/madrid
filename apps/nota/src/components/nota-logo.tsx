import { cn } from '@/lib/utils';
import { NOTA_N_LOGO_VIEWBOX, NOTA_N_STROKES } from '@/lib/nota-n-mark.mjs';

interface NotaLogoProps {
  className?: string;
}

/** Geometric N. Plate icons: `public/favicon.svg`. */
export function NotaLogo({ className }: NotaLogoProps) {
  return (
    <svg
      viewBox={NOTA_N_LOGO_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeLinecap="round">
        {NOTA_N_STROKES.map((stroke) => (
          <line
            key={stroke.key}
            x1={stroke.x1}
            y1={stroke.y1}
            x2={stroke.x2}
            y2={stroke.y2}
            strokeWidth={stroke.width}
          />
        ))}
      </g>
    </svg>
  );
}
