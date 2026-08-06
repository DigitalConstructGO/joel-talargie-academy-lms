'use client';

import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useBreadcrumbTrail } from '@/hooks/use-breadcrumb-trail';
import { ROUTES } from '@/constants/routes';
import { ADMIN_NAV } from '@/constants/nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const crumbs = useBreadcrumbTrail(ADMIN_NAV, 'Administrator', ROUTES.admin.root);

  return (
    <DashboardShell
      sections={ADMIN_NAV}
      portalLabel="Administrator"
      breadcrumb={<PageBreadcrumb items={crumbs} />}
    >
      {children}
    </DashboardShell>
  );
}
