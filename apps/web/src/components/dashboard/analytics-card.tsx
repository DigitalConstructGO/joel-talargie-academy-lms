import { ArrowDown, ArrowUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AnalyticsCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  /** Optional sparkline/mini-chart rendered under the value - compose with recharts via ChartCard's ChartContainer if needed. */
  chart?: React.ReactNode;
  className?: string;
}

/** Like StatCard, but with room for an inline sparkline/mini-chart beneath the headline number. */
export function AnalyticsCard({
  label,
  value,
  icon: Icon,
  trend,
  chart,
  className,
}: AnalyticsCardProps) {
  const isPositive = trend !== undefined && trend.value >= 0;

  return (
    <Card className={cn('flex flex-col gap-3 p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-xs font-medium',
                isPositive ? 'text-success' : 'text-destructive',
              )}
            >
              {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ''}
            </p>
          )}
        </div>
        {chart && <div className="h-12 w-24 shrink-0">{chart}</div>}
      </div>
    </Card>
  );
}
