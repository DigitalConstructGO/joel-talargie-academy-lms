'use client';

import { AnimatedCounter } from '@/components/common/animated-counter';
import { formatCompactNumber } from '@/lib/format';

export type StatsBandKind = 'count' | 'rating' | 'percent';

export interface StatsBandItem {
  value: number;
  label: string;
  kind: StatsBandKind;
}

const FORMATTERS: Record<StatsBandKind, (value: number) => string> = {
  count: (value) => `${formatCompactNumber(value)}+`,
  rating: (value) => `${value.toFixed(1)}/5`,
  percent: (value) => `${value}%`,
};

export function StatsBandSection({ items }: { items: StatsBandItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="bg-lime-400">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-14 text-center sm:grid-cols-3 sm:px-6">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <span className="text-4xl font-bold tracking-tight text-[#120c08] sm:text-5xl">
              <AnimatedCounter value={item.value} format={FORMATTERS[item.kind]} />
            </span>
            <span className="text-sm font-medium text-slate-800">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
