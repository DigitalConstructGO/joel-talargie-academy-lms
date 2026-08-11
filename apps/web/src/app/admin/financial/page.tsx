'use client';

import { CreditCard, Tag, Wallet } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { Reveal } from '@/components/common/reveal';
import { StatCard } from '@/components/dashboard/stat-card';
import { QuickActionCard } from '@/components/dashboard/quick-action-card';
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard';
import { useAdminCampaigns } from '@/features/promotions/hooks/use-admin-campaigns';
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
    label: 'Campaigns',
    description: 'Manage promotional campaigns',
    href: ROUTES.admin.financialPromotions,
  },
  {
    icon: Tag,
    label: 'Promo Codes',
    description: 'Manage individual coupon codes',
    href: ROUTES.admin.financialPromoCodes,
  },
];

export default function AdminFinancialPage() {
  const overviewQuery = useDashboardOverview();
  const activeCampaignsQuery = useAdminCampaigns({ status: 'ACTIVE', pageSize: 1 });
  const activeCouponsQuery = useAdminCoupons({ status: 'ACTIVE', pageSize: 1 });

  return (
    <ContentContainer>
      <PageHeader title="Financial Management" description="Payments and promotions overview." />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={CreditCard}
            label="Pending payments"
            value={
              overviewQuery.data?.kpis.payments.waitingForReview ??
              (overviewQuery.isLoading ? '—' : 0)
            }
            tone="warning"
          />
          <StatCard
            icon={Tag}
            label="Active campaigns"
            value={activeCampaignsQuery.data?.total ?? (activeCampaignsQuery.isLoading ? '—' : 0)}
            tone="primary"
          />
          <StatCard
            icon={Wallet}
            label="Active promo codes"
            value={activeCouponsQuery.data?.total ?? (activeCouponsQuery.isLoading ? '—' : 0)}
            tone="success"
          />
        </div>
      </Reveal>

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <QuickActionCard key={link.label} {...link} />
          ))}
        </div>
      </Reveal>
    </ContentContainer>
  );
}
