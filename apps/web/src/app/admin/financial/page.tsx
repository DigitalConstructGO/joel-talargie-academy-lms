'use client';

import { CreditCard, Landmark, Tag, Wallet } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { Reveal } from '@/components/common/reveal';
import { StatCard } from '@/components/dashboard/stat-card';
import { QuickActionCard } from '@/components/dashboard/quick-action-card';
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard';
import { useAdminCoupons } from '@/features/promotions/hooks/use-admin-coupons';
import { ROUTES } from '@/constants/routes';

const QUICK_LINKS = [
  {
    icon: CreditCard,
    label: 'Payments',
    description: 'Review and approve student payments',
    href: ROUTES.admin.financialPayments,
  },
  {
    icon: Tag,
    label: 'Promo Codes',
    description: 'Manage discount coupon codes',
    href: ROUTES.admin.financialPromoCodes,
  },
  {
    icon: Landmark,
    label: 'Payment Methods',
    description: 'Configure methods students can pay with',
    href: ROUTES.admin.financialPaymentMethods,
  },
];

import { useLanguage } from '@/lib/i18n/language-provider';

export default function AdminFinancialPage() {
  const { t } = useLanguage();
  const overviewQuery = useDashboardOverview();
  const activeCouponsQuery = useAdminCoupons({ status: 'ACTIVE', pageSize: 1 });

  const quickLinks = [
    {
      icon: CreditCard,
      label: t('sidebar.financial'),
      description: 'Review and approve student payments',
      href: ROUTES.admin.financialPayments,
    },
    {
      icon: Tag,
      label: 'Promo Codes',
      description: 'Manage discount coupon codes',
      href: ROUTES.admin.financialPromoCodes,
    },
    {
      icon: Landmark,
      label: 'Payment Methods',
      description: 'Configure methods students can pay with',
      href: ROUTES.admin.financialPaymentMethods,
    },
  ];

  return (
    <ContentContainer>
      <PageHeader title={t('sidebar.financial')} description={t('categories.subtitle')} />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={CreditCard}
            label={t('common.pending')}
            value={
              overviewQuery.data?.kpis?.payments?.waitingForReview ??
              (overviewQuery.isLoading ? '—' : 0)
            }
            tone="warning"
          />
          <StatCard
            icon={Wallet}
            label={t('common.active')}
            value={activeCouponsQuery.data?.total ?? (activeCouponsQuery.isLoading ? '—' : 0)}
            tone="success"
          />
        </div>
      </Reveal>

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <QuickActionCard key={link.label} {...link} />
          ))}
        </div>
      </Reveal>
    </ContentContainer>
  );
}
