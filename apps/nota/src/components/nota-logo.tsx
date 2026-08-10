import { cn } from '@/lib/utils';

interface NotaLogoProps {
  className?: string;
}

/** Liquid-glass note stack. Static favicon: `public/favicon.svg`. */
export function NotaLogo({ className }: NotaLogoProps) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden="true"
    >
      <rect
        x="8"
        y="6"
        width="22"
        height="28"
        rx="4.5"
        fill="currentColor"
        fillOpacity="0.28"
        transform="rotate(-8 19 20)"
      />
      <rect
        x="10"
        y="7"
        width="22"
        height="28"
        rx="4.5"
        fill="currentColor"
        fillOpacity="0.55"
        transform="rotate(4 21 21)"
      />
      <rect
        x="12"
        y="9"
        width="20"
        height="27"
        rx="4"
        fill="currentColor"
        fillOpacity="1"
      />
    </svg>
  );
}
