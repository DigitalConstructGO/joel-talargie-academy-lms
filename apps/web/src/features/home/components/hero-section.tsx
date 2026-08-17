'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

import type { HeroSettings } from '@/features/settings/types/settings.types';

export function HeroSection({ hero }: { hero?: HeroSettings }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const heading = hero?.heading || 'Engineer Your Next Career Move.';
  const description =
    hero?.description ||
    'Learn directly from the source. Elite industry experts meticulously designed our structured, self-paced curriculum to deliver elite results with zero fluff. You are not just buying a course; you are investing in a masterclass.';
  const primaryCtaText = hero?.primaryCtaText || 'View Curriculum';
  const primaryCtaUrl = hero?.primaryCtaUrl || ROUTES.courses.list;
  const secondaryCtaText = hero?.secondaryCtaText || 'Create free account';
  const secondaryCtaUrl = hero?.secondaryCtaUrl || ROUTES.auth.register;
  const heroImage = hero?.heroImageUrl || '/images/hero/network-abstract.jpg';

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    startTransition(() => {
      router.push(`${ROUTES.courses.list}?search=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            <Sparkles className="size-3.5" />
            Learn with purpose
          </span>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {heading}
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">{description}</p>

          <form onSubmit={handleSearch} className="flex w-full max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="What do you want to learn?"
                aria-label="Search courses"
                disabled={isPending}
                className="h-12 pl-10"
              />
            </div>
            <Button type="submit" size="lg" disabled={isPending} className="h-12 shrink-0">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={primaryCtaUrl}>
                {primaryCtaText}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={secondaryCtaUrl}>{secondaryCtaText}</Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-surface-dark lg:aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt="Abstract digital network visualization"
            className="size-full object-cover"
          />
          <div
            className="absolute inset-0 opacity-60 mix-blend-multiply"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, hsl(var(--chart-1) / 0.5), transparent 45%), radial-gradient(circle at 80% 30%, hsl(var(--surface-dark) / 0.6), transparent 50%)',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-surface-dark via-surface-dark/10 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="max-w-xs text-sm text-slate-300">
              Real courses. Real instructors. A learning system built to get you hired, promoted, or
              paid more.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
