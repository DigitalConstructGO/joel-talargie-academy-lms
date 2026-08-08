import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TONE_CLASSES = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  teal: 'bg-tertiary/10 text-tertiary',
} as const;

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  suffix?: React.ReactNode;
  tone?: keyof typeof TONE_CLASSES;
  className?: string;
}

/** A compact metric tile - icon, uppercase label, and a big value - for a dashboard stats row. */
export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone = 'primary',
  className,
}: StatCardProps) {
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
      </div>
    </Card>
  );
}
