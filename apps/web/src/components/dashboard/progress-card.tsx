import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ProgressCardProps {
  label: string;
  value: number;
  description?: string;
  className?: string;
}

/** A card built around a circular progress ring - for a single "how far along" metric (e.g. course completion). */
export function ProgressCard({ label, value, description, className }: ProgressCardProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Card className={cn('flex items-center gap-4 p-5', className)}>
      <svg viewBox="0 0 96 96" className="size-20 shrink-0 -rotate-90">
        <circle cx="48" cy="48" r={radius} className="stroke-muted" strokeWidth="8" fill="none" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          className="stroke-brand transition-[stroke-dashoffset] duration-500 ease-out"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text
          x="48"
          y="48"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 fill-foreground text-[22px] font-semibold"
          style={{ transformOrigin: '48px 48px' }}
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </Card>
  );
}
