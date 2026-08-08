import type { LucideIcon } from 'lucide-react';
import { Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  icon?: LucideIcon;
  description: string;
  timestamp: string;
}

export interface ActivityCardProps {
  title: string;
  items: ActivityItem[];
  emptyLabel?: string;
  className?: string;
}

/** A vertical feed of recent activity items with a connecting timeline rail. */
export function ActivityCard({
  title,
  items,
  emptyLabel = 'No recent activity',
  className,
}: ActivityCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title={emptyLabel} className="border-none bg-transparent p-6" />
        ) : (
          <ol className="flex flex-col gap-5">
            {items.map((item, index) => {
              const Icon = item.icon ?? Circle;
              return (
                <li key={item.id} className="relative flex gap-3">
                  {index < items.length - 1 && (
                    <span
                      className="absolute left-[15px] top-7 h-[calc(100%+8px)] w-px bg-border"
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-sm text-foreground">{item.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.timestamp}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
