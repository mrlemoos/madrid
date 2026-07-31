import { forwardRef, useImperativeHandle, useCallback } from 'react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types.js';
import { gateIconHover } from '../lib/icon-hover-motion.js';
import { motion, useAnimate } from 'motion/react';

const FolderIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = 'currentColor', strokeWidth = 2, className = '' },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const openFolder = useCallback(async () => {
      await Promise.all([
        animate(
          '.folder-closed',
          { opacity: 0 },
          { duration: 0.16, ease: 'easeOut' },
        ),
        animate(
          '.folder-open',
          { opacity: 1, scale: [0.9, 1.05, 1] },
          { duration: 0.28, ease: 'easeOut' },
        ),
      ]);
    }, [animate]);

    const closeFolder = useCallback(async () => {
      await Promise.all([
        animate(
          '.folder-open',
          { opacity: 0, scale: 0.92 },
          { duration: 0.16, ease: 'easeIn' },
        ),
        animate(
          '.folder-closed',
          { opacity: 1 },
          { duration: 0.2, ease: 'easeInOut' },
        ),
      ]);
    }, [animate]);

    useImperativeHandle(ref, () => ({
      startAnimation: openFolder,
      stopAnimation: closeFolder,
    }));

    return (
      <motion.svg
        ref={scope}
        onHoverStart={gateIconHover(openFolder)}
        onHoverEnd={gateIconHover(closeFolder)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
        style={{ overflow: 'visible' }}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />

        {/* Closed folder (rest) */}
        <motion.g className="folder-closed" style={{ opacity: 1 }}>
          <path d="M3 7a2 2 0 0 1 2 -2h3.9a2 2 0 0 1 1.6 .8l1 1.2H19a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2z" />
          <path d="M4 12h16v5a2 2 0 0 1 -2 2H6a2 2 0 0 1 -2 -2z" />
        </motion.g>

        {/* Open folder (hover) */}
        <motion.g
          className="folder-open"
          style={{ opacity: 0, transformOrigin: 'center' }}
        >
          <path d="M4 19V6a2 2 0 0 1 2 -2h3.6a2 2 0 0 1 1.6 .8l1 1.2H18a2 2 0 0 1 2 2v1" />
          <path d="M2.5 12h18.2a1 1 0 0 1 1 1.2l-1.3 6a1 1 0 0 1 -1 .8H4a2 2 0 0 1 -2 -2z" />
        </motion.g>
      </motion.svg>
    );
  },
);

FolderIcon.displayName = 'FolderIcon';
export default FolderIcon;
