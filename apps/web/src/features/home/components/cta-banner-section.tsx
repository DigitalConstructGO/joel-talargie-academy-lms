import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import type { FinalCtaSettings } from '@/features/settings/types/settings.types';

export function CtaBannerSection({ finalCta }: { finalCta?: FinalCtaSettings }) {
  const heading = finalCta?.heading || 'Ready to Start?';
  const description =
    finalCta?.description ||
    'Join for free and get access to our full course catalog today - no credit card required.';
  const ctaText = finalCta?.ctaText || 'Create your free account';
  const ctaUrl = finalCta?.ctaUrl || ROUTES.auth.register;

  return (
    <section className="bg-surface-dark text-surface-dark-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{heading}</h2>
        <p className="max-w-xl text-slate-400">{description}</p>
        <Button size="lg" className="mt-2 bg-chart-1 text-surface-dark hover:bg-chart-1/90" asChild>
          <Link href={ctaUrl}>
            {ctaText}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
