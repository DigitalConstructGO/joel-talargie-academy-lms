import type { LucideIcon } from 'lucide-react';
import { Archive, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NotificationCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  timestamp?: string;
  read?: boolean;
  onClick?: () => void;
  onArchive?: () => void;
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
  onArchive,
  className,
}: NotificationCardProps) {
  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent',
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
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn('min-w-0 flex-1 text-left', !onClick && 'cursor-default')}
      >
        <p
          className={cn('text-sm', read ? 'text-muted-foreground' : 'font-medium text-foreground')}
        >
          {title}
        </p>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>
        )}
        {timestamp && <p className="mt-1 text-[11px] text-muted-foreground">{timestamp}</p>}
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        {!read && <span className="size-2 rounded-full bg-brand" aria-hidden="true" />}
        {onArchive && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
            onClick={onArchive}
            aria-label={`Archive ${title}`}
          >
            <Archive className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
