import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
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
      <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {trend && (
        <p
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-success' : 'text-destructive',
          )}
        >
          {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ''}
        </p>
      )}
    </Card>
  );
}
