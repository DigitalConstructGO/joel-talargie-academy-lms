'use client';

import { motion } from 'framer-motion';

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delaySeconds?: number;
  direction?: 'up' | 'none';
}

/** Fades (and optionally slides) children into view once as the user scrolls to them. */
export function Reveal({ children, className, delaySeconds = 0, direction = 'up' }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: direction === 'up' ? 24 : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.5, delay: delaySeconds, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
