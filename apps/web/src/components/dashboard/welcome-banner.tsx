import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface WelcomeBannerProps {
  greeting: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaIcon?: LucideIcon;
  className?: string;
}

/** Dark hero card at the top of a dashboard home page - greeting, context sentence, and a primary CTA. */
export function WelcomeBanner({
  greeting,
  description,
  ctaLabel,
  ctaHref,
  ctaIcon: Icon = Play,
  className,
}: WelcomeBannerProps) {
  return (
    <div
      className={cn(
        'flex min-h-60 flex-col justify-between gap-6 rounded-2xl bg-sidebar p-8',
        className,
      )}
    >
      <div>
        <h2 className="text-3xl font-bold text-sidebar-foreground">{greeting}</h2>
        <p className="mt-2 max-w-md text-sidebar-foreground/70">{description}</p>
      </div>
      <Button asChild size="lg" className="w-fit gap-2">
        <Link href={ctaHref}>
          {ctaLabel}
          <Icon className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
