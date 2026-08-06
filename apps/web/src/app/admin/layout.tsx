'use client';

import { usePathname } from 'next/navigation';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useBreadcrumbTrail } from '@/hooks/use-breadcrumb-trail';
import { ROUTES } from '@/constants/routes';
import { ADMIN_NAV } from '@/constants/nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const crumbs = useBreadcrumbTrail(ADMIN_NAV, 'Administrator', ROUTES.admin.root);
  const isRoot = pathname === ROUTES.admin.root;

  return (
    <DashboardShell
      sections={ADMIN_NAV}
      portalLabel="Administrator"
      rootHref={ROUTES.admin.root}
      breadcrumb={<PageBreadcrumb items={crumbs} />}
      title={isRoot ? crumbs.at(-1)?.label : undefined}
    >
      {children}
    </DashboardShell>
  );
}
