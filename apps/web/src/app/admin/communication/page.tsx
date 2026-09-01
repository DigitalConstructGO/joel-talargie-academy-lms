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

import { useLanguage } from '@/lib/i18n/language-provider';

export default function AdminCommunicationPage() {
  const { t } = useLanguage();
  const unreadQuery = useUnreadNotificationsCount();
  const templatesQuery = useEmailTemplates();

  const quickLinks = [
    {
      icon: Bell,
      label: t('sidebar.notifications'),
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

  return (
    <ContentContainer>
      <PageHeader title={t('sidebar.notifications')} description={t('categories.subtitle')} />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={Bell}
            label={t('sidebar.notifications')}
            value={unreadQuery.data?.unreadCount ?? (unreadQuery.isLoading ? '—' : 0)}
            tone="warning"
          />
          <StatCard
            icon={Mail}
            label="Email Templates"
            value={templatesQuery.data?.length ?? (templatesQuery.isLoading ? '—' : 0)}
            tone="info"
          />
        </div>
      </Reveal>

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <QuickActionCard key={link.label} {...link} />
          ))}
        </div>
      </Reveal>
    </ContentContainer>
  );
}
