'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';

export interface AnimatedCounterProps {
  value: number;
  format?: (value: number) => string;
  durationSeconds?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  format,
  durationSeconds = 1.4,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const isIntegerTarget = Number.isInteger(value);
    const controls = animate(0, value, {
      duration: durationSeconds,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(isIntegerTarget ? Math.round(latest) : latest),
    });
    return () => controls.stop();
  }, [isInView, value, durationSeconds]);

  return (
    <span ref={ref} className={className}>
      {format ? format(display) : display}
    </span>
  );
}
