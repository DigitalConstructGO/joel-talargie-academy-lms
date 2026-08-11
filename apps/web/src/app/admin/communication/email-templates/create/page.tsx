import { Mail } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';
import { ROUTES } from '@/constants/routes';

export default function AdminEmailTemplateCreatePage() {
  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Communication', href: ROUTES.admin.communication },
          { label: 'Email Templates', href: ROUTES.admin.communicationEmailTemplates },
          { label: 'New template' },
        ]}
      />
      <PageHeader title="New email template" description="Create a transactional email template." />
      <ComingSoonSection
        feature="Custom email template creation"
        icon={Mail}
        description="System email templates are currently managed in code, not through the admin dashboard. The backend doesn't yet expose an endpoint to create or edit templates - existing templates can still be viewed and previewed."
      />
    </ContentContainer>
  );
}
