import Link from 'next/link';
import { Plus, ShieldCheck } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/can';
import { ROUTES } from '@/constants/routes';

export default function AdminRolesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Roles"
        description="Manage roles and role assignments."
        actions={
          <Can permission="roles.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.systemRoleCreate}>
                <Plus className="size-4" />
                New Role
              </Link>
            </Button>
          </Can>
        }
      />
      <ComingSoonSection feature="Role management" icon={ShieldCheck} />
    </ContentContainer>
  );
}
