'use client';

import { usePathname } from 'next/navigation';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AuthorizationGate } from '@/components/auth/authorization-gate';
import { useBreadcrumbTrail } from '@/hooks/use-breadcrumb-trail';
import { usePermissions } from '@/hooks/use-permissions';
import { usePendingPaymentsCount } from '@/features/payments/hooks/use-admin-payments';
import { ROUTES } from '@/constants/routes';
import { ADMIN_NAV } from '@/constants/nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const crumbs = useBreadcrumbTrail(ADMIN_NAV, 'Administrator', ROUTES.admin.root);
  const isRoot = pathname === ROUTES.admin.root;
  const { can } = usePermissions();
  const { data: pendingPaymentsCount } = usePendingPaymentsCount();

  return (
    <AuthorizationGate sections={ADMIN_NAV} requirePortalAccess restrictTo="staff">
      <DashboardShell
        sections={ADMIN_NAV}
        portalLabel="Administrator"
        rootHref={ROUTES.admin.root}
        breadcrumb={<PageBreadcrumb items={crumbs} />}
        title={isRoot ? crumbs.at(-1)?.label : undefined}
        hasPermission={can}
        badgeFor={(item) =>
          item.href === ROUTES.admin.financialPayments && (pendingPaymentsCount ?? 0) > 0
            ? { label: String(pendingPaymentsCount), variant: 'warning' }
            : undefined
        }
      >
        {children}
      </DashboardShell>
    </AuthorizationGate>
  );
}
