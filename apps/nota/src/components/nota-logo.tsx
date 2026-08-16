import { cn } from '@/lib/utils';
import { NOTA_N_LOGO_VIEWBOX, NOTA_N_PATH } from '@/lib/nota-n-mark.mjs';

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
      <path d={NOTA_N_PATH} fill="currentColor" />
    </svg>
  );
}
