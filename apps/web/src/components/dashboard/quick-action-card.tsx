import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/** A single clickable tile for a dashboard "quick actions" grid - renders as a link when `href` is given, otherwise a button. */
export function QuickActionCard({
  icon: Icon,
  label,
  description,
  href,
  onClick,
  className,
}: QuickActionCardProps) {
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 text-left">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </>
  );

  const sharedClassName = cn(
    'flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={sharedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={sharedClassName}>
      {content}
    </button>
  );
}
