import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CourseChecklistProps {
  title: string;
  items: string[];
  variant?: 'check' | 'dot';
  className?: string;
}

export function CourseChecklist({
  title,
  items,
  variant = 'check',
  className,
}: CourseChecklistProps) {
  if (items.length === 0) return null;
  const Icon = variant === 'check' ? Check : Circle;

  return (
    <div className={className}>
      <h2 className="mb-3 text-lg font-semibold text-foreground">{title}</h2>
      <ul
        className={cn(
          'grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-border p-4 sm:grid-cols-2',
        )}
      >
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-foreground">
            <Icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                variant === 'check'
                  ? 'text-success'
                  : 'fill-muted-foreground/40 text-muted-foreground/40',
              )}
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
