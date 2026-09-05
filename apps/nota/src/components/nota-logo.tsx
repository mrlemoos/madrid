import { cn } from '@/lib/utils';
import {
  MADRID_ARCH_FLOURISH_PATH,
  MADRID_ARCH_PATH,
  MADRID_MARK_LOGO_VIEWBOX,
  MADRID_M_PATH,
} from '@/lib/madrid-mark.mjs';

interface NotaLogoProps {
  className?: string;
}

/** Wrought-iron Madrid M. Plate icons: `public/favicon.svg`. */
export function NotaLogo({ className }: NotaLogoProps) {
  return (
    <svg
      viewBox={MADRID_MARK_LOGO_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden="true"
    >
      <path d={MADRID_ARCH_PATH} fill="currentColor" />
      <path d={MADRID_ARCH_FLOURISH_PATH} fill="currentColor" />
      <path d={MADRID_M_PATH} fill="currentColor" />
    </svg>
  );
}
