import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  target?: string;
  progress?: number;
  className?: string;
}

export function MetricCard({ label, value, target, progress, className }: MetricCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3 p-5', className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {target && <p className="text-sm text-muted-foreground">/ {target}</p>}
      </div>
      {progress !== undefined && (
        <Progress value={Math.min(Math.max(progress, 0), 100)} aria-label={`${label} progress`} />
      )}
    </Card>
  );
}
