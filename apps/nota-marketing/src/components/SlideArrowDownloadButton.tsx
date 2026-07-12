import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

type SlideArrowDownloadButtonProps = {
  href: string;
  className?: string;
  variant?: 'hero' | 'page';
};

const variantClassName = {
  hero: 'text-white bg-white/[0.04] hover:bg-white/[0.06] border-white/5',
  page: 'text-foreground bg-foreground/[0.04] hover:bg-foreground/[0.06] border-border',
} as const;

export default function SlideArrowDownloadButton({
  href,
  className,
  variant = 'page',
}: SlideArrowDownloadButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href={href}
      data-nota-download-mac
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      className={[
        'relative flex items-center justify-center h-[36px] px-6 rounded-[40px] border cursor-pointer transition-colors duration-150',
        variantClassName[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <AnimatePresence mode="popLayout">
        {!isHovered && (
          <motion.div
            key="icon1"
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -10 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25 }}
            className="flex items-center shrink-0 mr-2.5"
          >
            <AppleIcon className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="font-medium tracking-tight text-[13px]">
        Download for Mac
      </span>
      <AnimatePresence mode="popLayout">
        {isHovered && (
          <motion.div
            key="icon2"
            initial={reduceMotion ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 10 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25 }}
            className="flex items-center shrink-0 ml-2.5"
          >
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.a>
  );
}
