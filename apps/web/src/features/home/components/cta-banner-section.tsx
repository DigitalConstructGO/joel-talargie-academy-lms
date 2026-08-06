import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function CtaBannerSection() {
  return (
    <section className="bg-surface-dark text-surface-dark-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to Start?</h2>
        <p className="max-w-xl text-slate-400">
          Join for free and get access to our full course catalog today - no credit card required.
        </p>
        <Button size="lg" className="mt-2 bg-chart-1 text-surface-dark hover:bg-chart-1/90" asChild>
          <Link href={ROUTES.auth.register}>
            Create your free account
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
