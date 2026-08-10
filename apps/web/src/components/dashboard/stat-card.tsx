import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TONE_CLASSES = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  teal: 'bg-tertiary/10 text-tertiary',
} as const;

/** Mirrors the backend's `comparison()` shape (`DashboardService.comparison` in `dashboard.service.ts`). */
export interface StatCardTrend {
  direction: 'UP' | 'DOWN' | 'FLAT' | 'NOT_AVAILABLE';
  changePercentage: string | null;
  /** e.g. "vs previous period" - defaults to that if omitted. */
  label?: string;
}

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  suffix?: React.ReactNode;
  tone?: keyof typeof TONE_CLASSES;
  trend?: StatCardTrend;
  className?: string;
}

const TREND_ICON = { UP: ArrowUp, DOWN: ArrowDown, FLAT: Minus, NOT_AVAILABLE: Minus } as const;
const TREND_CLASSES = {
  UP: 'text-success',
  DOWN: 'text-destructive',
  FLAT: 'text-muted-foreground',
  NOT_AVAILABLE: 'text-muted-foreground',
} as const;

/** A compact metric tile - icon, uppercase label, and a big value - for a dashboard stats row. */
export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone = 'primary',
  trend,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null;
  return (
    <Card
      className={cn(
        'flex items-center gap-4 p-4 transition-transform duration-200 hover:-translate-y-1',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-xl',
          TONE_CLASSES[tone],
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-bold text-foreground">
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span>
          )}
        </p>
        {trend && TrendIcon && (
          <p
            className={cn(
              'mt-0.5 flex items-center gap-1 text-xs font-medium',
              TREND_CLASSES[trend.direction],
            )}
          >
            <TrendIcon className="size-3" aria-hidden="true" />
            {trend.direction === 'NOT_AVAILABLE'
              ? 'No prior data'
              : `${trend.changePercentage ?? '0'}%`}
            <span className="font-normal text-muted-foreground">
              {trend.label ?? 'vs previous period'}
            </span>
          </p>
        )}
      </div>
    </Card>
  );
}
