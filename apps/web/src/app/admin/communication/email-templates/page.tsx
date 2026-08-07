import Link from 'next/link';
import { Mail, Plus } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/can';
import { ROUTES } from '@/constants/routes';

export default function AdminEmailTemplatesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Email Templates"
        description="Manage transactional email templates."
        actions={
          <Can permission="notifications.manage_templates">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.communicationEmailTemplateCreate}>
                <Plus className="size-4" />
                New Template
              </Link>
            </Button>
          </Can>
        }
      />
      <ComingSoonSection feature="Email template management" icon={Mail} />
    </ContentContainer>
  );
}
