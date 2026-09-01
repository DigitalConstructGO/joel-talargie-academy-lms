'use client';

import {
  Award,
  CheckCircle2,
  Clock,
  GraduationCap,
  PlayCircle,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FeatureCard } from '@/components/marketing/feature-card';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { WhyChooseUsItem } from '@/features/settings/types/settings.types';

const ICON_MAP: Record<string, LucideIcon> = {
  Clock,
  Users,
  Award,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Search,
  PlayCircle,
  Sparkles,
  CheckCircle2,
  Target,
  Zap,
  GraduationCap,
  Star,
};

export function WhyChooseUsSection({ items }: { items?: WhyChooseUsItem[] }) {
  const { t, locale } = useLanguage();

  const defaultFeatures: WhyChooseUsItem[] = [
    {
      id: '1',
      icon: 'Clock',
      title: t('whyUs.card1Title'),
      description: t('whyUs.card1Desc'),
      displayOrder: 1,
      isActive: true,
    },
    {
      id: '2',
      icon: 'Award',
      title: t('whyUs.card3Title'),
      description: t('whyUs.card3Desc'),
      displayOrder: 2,
      isActive: true,
    },
    {
      id: '3',
      icon: 'ShieldCheck',
      title: t('whyUs.card2Title'),
      description: t('whyUs.card2Desc'),
      displayOrder: 3,
      isActive: true,
    },
    {
      id: '4',
      icon: 'Smartphone',
      title: t('whyUs.card1Title'),
      description: t('whyUs.card1Desc'),
      displayOrder: 4,
      isActive: true,
    },
  ];

  const displayItems = items && items.length > 0 && locale === 'en' ? items : defaultFeatures;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('whyUs.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('whyUs.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayItems.map((feature) => {
          const Icon = ICON_MAP[feature.icon] ?? Sparkles;
          return (
            <FeatureCard
              key={feature.id || feature.title}
              icon={Icon}
              title={feature.title}
              description={feature.description}
            />
          );
        })}
      </div>
    </section>
  );
}
