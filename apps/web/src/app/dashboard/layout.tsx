'use client';

import { usePathname } from 'next/navigation';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AuthorizationGate } from '@/components/auth/authorization-gate';
import { useBreadcrumbTrail } from '@/hooks/use-breadcrumb-trail';
import { usePermissions } from '@/hooks/use-permissions';
import { ROUTES } from '@/constants/routes';
import { STUDENT_NAV } from '@/constants/nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const crumbs = useBreadcrumbTrail(STUDENT_NAV, 'Dashboard', ROUTES.dashboard.root);
  const isRoot = pathname === ROUTES.dashboard.root;
  const { can } = usePermissions();

  return (
    <AuthorizationGate sections={STUDENT_NAV} restrictTo="student">
      <DashboardShell
        sections={STUDENT_NAV}
        portalLabel="Student"
        rootHref={ROUTES.dashboard.root}
        breadcrumb={<PageBreadcrumb items={crumbs} />}
        title={isRoot ? crumbs.at(-1)?.label : undefined}
        hasPermission={can}
      >
        {children}
      </DashboardShell>
    </AuthorizationGate>
  );
}
