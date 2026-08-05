import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function CtaBannerSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-brand px-6 py-14 text-center text-brand-foreground">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to start learning?
        </h2>
        <p className="max-w-xl text-brand-foreground/90">
          Join for free and get access to our full course catalog today.
        </p>
        <Button variant="secondary" size="lg" asChild>
          <Link href={ROUTES.auth.register}>
            Create your free account
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
