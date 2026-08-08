'use client';

import { Bell, Mail } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { Reveal } from '@/components/common/reveal';
import { StatCard } from '@/components/dashboard/stat-card';
import { QuickActionCard } from '@/components/dashboard/quick-action-card';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks/use-notifications';
import { useEmailTemplates } from '@/features/email-templates/hooks/use-email-templates';
import { ROUTES } from '@/constants/routes';

const QUICK_LINKS = [
  {
    icon: Bell,
    label: 'Notifications',
    description: 'Your notification inbox',
    href: ROUTES.admin.communicationNotifications,
  },
  {
    icon: Mail,
    label: 'Email Templates',
    description: 'Preview transactional email templates',
    href: ROUTES.admin.communicationEmailTemplates,
  },
];

export default function AdminCommunicationPage() {
  const unreadQuery = useUnreadNotificationsCount();
  const templatesQuery = useEmailTemplates();

  return (
    <ContentContainer>
      <PageHeader title="Communication" description="Notifications and email templates overview." />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={Bell}
            label="Unread notifications"
            value={unreadQuery.data?.unreadCount ?? (unreadQuery.isLoading ? '—' : 0)}
            tone="warning"
          />
          <StatCard
            icon={Mail}
            label="Email templates"
            value={templatesQuery.data?.length ?? (templatesQuery.isLoading ? '—' : 0)}
            tone="info"
          />
        </div>
      </Reveal>

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => (
            <QuickActionCard key={link.label} {...link} />
          ))}
        </div>
      </Reveal>
    </ContentContainer>
  );
}
