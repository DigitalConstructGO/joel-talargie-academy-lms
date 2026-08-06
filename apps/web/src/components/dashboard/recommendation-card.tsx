import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RecommendationCardProps {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkLabel?: string;
  icon?: LucideIcon;
  className?: string;
}

/** Soft gradient promo card - a single suggested next step for the learner. */
export function RecommendationCard({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'View Module',
  icon: Icon = Sparkles,
  className,
}: RecommendationCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent to-card p-6',
        className,
      )}
    >
      <div className="relative z-10">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-accent-foreground/70">
          {eyebrow}
        </span>
        <h4 className="mb-2 font-semibold text-foreground">{title}</h4>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        <Link
          href={href}
          className="group flex w-fit items-center gap-1 text-sm font-semibold text-accent-foreground"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <Icon
        className="pointer-events-none absolute -bottom-4 -right-4 size-24 text-accent-foreground/10"
        aria-hidden="true"
      />
    </div>
  );
}
