'use client';

import { BarChart3, GraduationCap, Users, Wallet } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { Reveal } from '@/components/common/reveal';
import { QuickActionCard } from '@/components/dashboard/quick-action-card';
import { ProfileCard } from '@/components/dashboard/profile-card';
import { ActivityCard } from '@/components/dashboard/activity-card';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';

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
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Administrator';

  return (
    <ContentContainer>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? 'Administrator'}`}
        description="Here's a quick overview of the platform."
      />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.label} {...action} />
          ))}
        </div>
      </Reveal>

      <Reveal delaySeconds={0.1}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ProfileCard
            name={fullName}
            role="Administrator"
            avatarUrl={user?.avatarUrl}
            className="lg:col-span-1"
          />
          <ActivityCard
            title="Recent activity"
            items={[]}
            emptyLabel="Platform activity will show up here once reporting is wired up."
            className="lg:col-span-2"
          />
        </div>
      </Reveal>
    </ContentContainer>
  );
}
