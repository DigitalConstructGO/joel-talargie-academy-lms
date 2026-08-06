import type { LucideIcon } from 'lucide-react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  timestamp?: string;
  read?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A single notification row - used by the header notification dropdown and any future notification list/inbox page. */
export function NotificationCard({
  icon: Icon = Bell,
  title,
  description,
  timestamp,
  read = false,
  onClick,
  className,
}: NotificationCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent',
        !read && 'bg-brand/5',
        className,
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
          read ? 'bg-muted text-muted-foreground' : 'bg-brand/10 text-brand',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn('text-sm', read ? 'text-muted-foreground' : 'font-medium text-foreground')}
        >
          {title}
        </p>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>
        )}
        {timestamp && <p className="mt-1 text-[11px] text-muted-foreground">{timestamp}</p>}
      </div>
      {!read && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
      )}
    </Wrapper>
  );
}
