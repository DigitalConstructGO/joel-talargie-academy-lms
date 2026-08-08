'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed
        ? `${ROUTES.courses.list}?search=${encodeURIComponent(trimmed)}`
        : ROUTES.courses.list,
    );
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
            Engineer Your Next Career Move.
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            Learn directly from the source. Elite industry experts meticulously designed our
            structured, self-paced curriculum to deliver elite results with zero fluff. You are not
            just buying a course; you are investing in a masterclass.
          </p>

          <form onSubmit={handleSearch} className="flex w-full max-w-md items-center gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What do you want to learn?"
              aria-label="Search courses"
              className="h-12"
            />
            <Button type="submit" size="lg" className="h-12 shrink-0">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={ROUTES.courses.list}>
                View Curriculum
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={ROUTES.auth.register}>Create free account</Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-surface-dark lg:aspect-square">
          <Image
            src="/images/hero/network-abstract.jpg"
            alt="Abstract digital network visualization"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
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
