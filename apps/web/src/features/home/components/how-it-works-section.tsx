'use client';

import { useLanguage } from '@/lib/i18n/language-provider';
import type { HowItWorksItem } from '@/features/settings/types/settings.types';

export function HowItWorksSection({ items }: { items?: HowItWorksItem[] }) {
  const { t, locale } = useLanguage();

  const defaultSteps: HowItWorksItem[] = [
    {
      id: '1',
      stepNumber: '01',
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Desc'),
      icon: 'UserPlus',
      displayOrder: 1,
      isActive: true,
    },
    {
      id: '2',
      stepNumber: '02',
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Desc'),
      icon: 'Search',
      displayOrder: 2,
      isActive: true,
    },
    {
      id: '3',
      stepNumber: '03',
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Desc'),
      icon: 'Award',
      displayOrder: 3,
      isActive: true,
    },
  ];

  const displaySteps = items && items.length > 0 && locale === 'en' ? items : defaultSteps;

  return (
    <section className="bg-surface-dark text-surface-dark-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('howItWorks.title')}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{t('howItWorks.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {displaySteps.map((step, index) => (
            <div
              key={step.id || step.title}
              className="flex flex-col gap-3 border-t-2 border-lime-400 pt-4"
            >
              <span className="text-3xl font-bold text-lime-400">
                {step.stepNumber || String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-sm font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
