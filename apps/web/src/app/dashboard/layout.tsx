'use client';

import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useBreadcrumbTrail } from '@/hooks/use-breadcrumb-trail';
import { ROUTES } from '@/constants/routes';
import { STUDENT_NAV } from '@/constants/nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const crumbs = useBreadcrumbTrail(STUDENT_NAV, 'Dashboard', ROUTES.dashboard.root);

  return (
    <DashboardShell
      sections={STUDENT_NAV}
      portalLabel="Student"
      breadcrumb={<PageBreadcrumb items={crumbs} />}
    >
      {children}
    </DashboardShell>
  );
}
