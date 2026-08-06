'use client';

import { BarChart3, CreditCard, GraduationCap, Users, Wallet } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { Reveal } from '@/components/common/reveal';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { ProgressCard } from '@/components/dashboard/progress-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { QuickActionCard } from '@/components/dashboard/quick-action-card';
import { ActivityCard } from '@/components/dashboard/activity-card';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';

const STATS = [
  { icon: Users, label: 'Total Students', value: '4,382', tone: 'primary' as const },
  { icon: GraduationCap, label: 'Active Courses', value: 128, tone: 'info' as const },
  { icon: Wallet, label: 'Monthly Revenue', value: '$32.4k', tone: 'success' as const },
  { icon: CreditCard, label: 'Pending Payments', value: 17, tone: 'warning' as const },
];

const QUICK_ACTIONS = [
  {
    icon: Users,
    label: 'User Management',
    description: 'Manage accounts',
    href: ROUTES.admin.users,
  },
  {
    icon: GraduationCap,
    label: 'Academic Management',
    description: 'Courses & categories',
    href: ROUTES.admin.academics,
  },
  {
    icon: Wallet,
    label: 'Financial Management',
    description: 'Payments & promotions',
    href: ROUTES.admin.financial,
  },
  {
    icon: BarChart3,
    label: 'Reports & Analytics',
    description: 'Platform insights',
    href: ROUTES.admin.reports,
  },
];

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName ?? 'Administrator';

  return (
    <ContentContainer>
      <Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <WelcomeBanner
            className="lg:col-span-2"
            greeting={`Welcome back, ${firstName} 👋`}
            description="Here's how the platform is performing today. Enrollment and revenue are both trending up this month."
            ctaLabel="View Reports"
            ctaHref={ROUTES.admin.reports}
            ctaIcon={BarChart3}
          />
          <ProgressCard
            label="Avg. Course Completion"
            description="Across all active courses"
            value={68}
          />
        </div>
      </Reveal>

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </Reveal>

      <Reveal delaySeconds={0.1}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.label} {...action} />
          ))}
        </div>
      </Reveal>

      <Reveal delaySeconds={0.15}>
        <ActivityCard
          title="Recent activity"
          items={[]}
          emptyLabel="Platform activity will show up here once reporting is wired up."
        />
      </Reveal>
    </ContentContainer>
  );
}
