import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { NotaIcon } from '@nota/web-design/icon';
import {
  AppleBrandLogoIcon,
  ArrowNarrowRightIcon,
} from '@nota/web-design/icons';

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
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
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
            <NotaIcon icon={AppleBrandLogoIcon} size={16} className="w-4 h-4" />
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
            <NotaIcon
              icon={ArrowNarrowRightIcon}
              size={16}
              className="w-4 h-4"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.a>
  );
}
