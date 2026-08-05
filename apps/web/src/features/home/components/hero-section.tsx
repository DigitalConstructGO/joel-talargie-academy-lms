'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';

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
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand/5 via-background to-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
        <Badge variant="secondary" className="tracking-wide uppercase">
          {siteConfig.tagline}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {siteConfig.description}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Explore courses built by real instructors, learn at your own pace, and earn certificates
          along the way.
        </p>

        <form onSubmit={handleSearch} className="flex w-full max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What do you want to learn?"
              aria-label="Search courses"
              className="h-12 pl-9"
            />
          </div>
          <Button type="submit" size="lg" className="h-12">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={ROUTES.courses.list}>
              Browse courses
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href={ROUTES.auth.register}>Create free account</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
