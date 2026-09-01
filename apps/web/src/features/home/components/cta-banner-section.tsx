'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { FinalCtaSettings } from '@/features/settings/types/settings.types';

export function CtaBannerSection({ finalCta }: { finalCta?: FinalCtaSettings }) {
  const { t, locale } = useLanguage();
  const heading = finalCta?.heading && locale === 'en' ? finalCta.heading : t('cta.title');
  const description =
    finalCta?.description && locale === 'en' ? finalCta.description : t('cta.subtitle');
  const ctaText = finalCta?.ctaText && locale === 'en' ? finalCta.ctaText : t('cta.button');
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
