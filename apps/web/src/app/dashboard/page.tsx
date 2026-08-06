'use client';

import { BookOpen, Compass, Heart, LifeBuoy } from 'lucide-react';
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
    icon: Compass,
    label: 'Browse Courses',
    description: 'Find your next course',
    href: ROUTES.courses.list,
  },
  {
    icon: BookOpen,
    label: 'My Courses',
    description: 'Continue learning',
    href: ROUTES.dashboard.courses,
  },
  {
    icon: Heart,
    label: 'Wishlist',
    description: 'Saved for later',
    href: ROUTES.dashboard.wishlist,
  },
  { icon: LifeBuoy, label: 'Support', description: 'Get help', href: ROUTES.dashboard.support },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'there';

  return (
    <ContentContainer>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? 'there'}`}
        description="Here's a quick overview of your learning space."
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
            role="Student"
            avatarUrl={user?.avatarUrl}
            className="lg:col-span-1"
          />
          <ActivityCard
            title="Recent activity"
            items={[]}
            emptyLabel="Your course activity will show up here once you start learning."
            className="lg:col-span-2"
          />
        </div>
      </Reveal>
    </ContentContainer>
  );
}
