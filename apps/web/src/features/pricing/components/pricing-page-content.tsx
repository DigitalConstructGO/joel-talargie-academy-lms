'use client';

import Link from 'next/link';
import { ArrowRight, Gift, Tag, Infinity as InfinityIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/page-header';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/constants/routes';
import { useLanguage } from '@/lib/i18n/language-provider';

export interface PricingPageContentProps {
  lowest: { price: string; discountPrice: string | null; currency: string } | null;
  highest: { price: string; discountPrice: string | null; currency: string } | null;
  freeCount: number;
  paidCount: number;
}

export function PricingPageContent({
  lowest,
  highest,
  freeCount,
  paidCount,
}: PricingPageContentProps) {
  const { t } = useLanguage();

  const pricingFaq = [
    {
      question: t('page.pricing.title'),
      answer: t('page.pricing.subtitle'),
    },
    {
      question: t('whyUs.card1Title'),
      answer: t('whyUs.card1Desc'),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6">
      <PageHeader title={t('page.pricing.title')} description={t('page.pricing.subtitle')} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
            <Gift className="size-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">{t('common.free')}</h3>
          <p className="text-sm text-muted-foreground">
            {freeCount}{' '}
            {freeCount === 1 ? t('catalog.courseCountOne') : t('catalog.courseCountOther')}
          </p>
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Tag className="size-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">{t('common.paid')}</h3>
          <p className="text-sm text-muted-foreground">
            {paidCount}{' '}
            {paidCount === 1 ? t('catalog.courseCountOne') : t('catalog.courseCountOther')}
            {lowest && highest
              ? `, ${formatCurrency(lowest.discountPrice ?? lowest.price, lowest.currency)} - ${formatCurrency(highest.discountPrice ?? highest.price, highest.currency)}.`
              : '.'}
          </p>
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-info/10 text-info">
            <InfinityIcon className="size-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">{t('value.selfPaced')}</h3>
          <p className="text-sm text-muted-foreground">{t('whyUs.subtitle')}</p>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button size="lg" asChild>
          <Link href={ROUTES.courses.list}>
            {t('featured.browseAll')}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
