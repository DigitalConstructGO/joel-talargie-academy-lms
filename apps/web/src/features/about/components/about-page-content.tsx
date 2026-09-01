'use client';

import { Award, BookOpen, Compass, Handshake, Heart, Lightbulb, Target, Users } from 'lucide-react';
import { Reveal } from '@/components/common/reveal';
import { StatsSection } from '@/features/home/components/stats-section';
import { CtaBannerSection } from '@/features/home/components/cta-banner-section';
import { FeatureCard } from '@/components/marketing/feature-card';
import { Timeline } from '@/components/marketing/timeline';
import { Card } from '@/components/ui/card';
import { siteConfig } from '@/config/site.config';
import { useLanguage } from '@/lib/i18n/language-provider';

export function AboutPageContent({
  stats,
}: {
  stats: { totalCourses: number; totalCategories: number; instructorCount: number };
}) {
  const { t } = useLanguage();

  const coreValues = [
    {
      icon: Target,
      title: t('whyUs.card1Title'),
      description: t('whyUs.card1Desc'),
    },
    {
      icon: Heart,
      title: t('whyUs.card2Title'),
      description: t('whyUs.card2Desc'),
    },
    {
      icon: Lightbulb,
      title: t('whyUs.card3Title'),
      description: t('whyUs.card3Desc'),
    },
  ];

  const timeline = [
    {
      year: 'Year 1',
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Desc'),
    },
    {
      year: 'Year 2',
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Desc'),
    },
    {
      year: 'Year 3',
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Desc'),
    },
  ];

  return (
    <div>
      <section className="border-b border-border bg-linear-to-b from-brand/5 via-background to-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('page.about.title')}
          </h1>
          <p className="text-lg text-muted-foreground">{t('page.about.subtitle')}</p>
        </div>
      </section>

      <Reveal>
        <StatsSection stats={stats} />
      </Reveal>

      <Reveal>
        <section className="border-t border-border bg-muted/20">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6">
            <Card className="flex flex-col gap-3 p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Compass className="size-5" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">{t('whyUs.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('whyUs.subtitle')}</p>
            </Card>
            <Card className="flex flex-col gap-3 p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Award className="size-5" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">{t('howItWorks.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('howItWorks.subtitle')}</p>
            </Card>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('whyUs.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {coreValues.map((value) => (
              <FeatureCard key={value.title} {...value} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">
            {t('howItWorks.title')}
          </h2>
          <Timeline entries={timeline} />
        </section>
      </Reveal>

      <Reveal>
        <CtaBannerSection />
      </Reveal>
    </div>
  );
}
