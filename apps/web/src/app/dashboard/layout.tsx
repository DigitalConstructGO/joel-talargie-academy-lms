'use client';

import { usePathname } from 'next/navigation';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AuthorizationGate } from '@/components/auth/authorization-gate';
import { useBreadcrumbTrail } from '@/hooks/use-breadcrumb-trail';
import { usePermissions } from '@/hooks/use-permissions';
import { useMyPendingPaymentsCount } from '@/features/payments/hooks/use-payments';
import { ROUTES } from '@/constants/routes';
import { STUDENT_NAV } from '@/constants/nav';

const FOCUS_MODE_PATTERN = /^\/dashboard\/courses\/[^/]+\/learn/;

// Checkout renders its own page-level breadcrumb (Home > Courses > Course > Checkout)
// because the global trail can't know the course from the URL - keep the two apart.
const SELF_BREADCRUMB_PATTERN = /^\/dashboard\/checkout/;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const crumbs = useBreadcrumbTrail(STUDENT_NAV, 'Dashboard', ROUTES.dashboard.root);
  const isRoot = pathname === ROUTES.dashboard.root;
  const { can } = usePermissions();
  const { data: pendingPaymentsCount } = useMyPendingPaymentsCount();

  // The lesson player is a deliberate full-bleed "Focus Mode" - it builds its
  // own header/sidebar rather than the standard dashboard chrome. Real
  // protection (AuthorizationGate) still applies; only DashboardShell is
  // skipped.
  if (pathname && FOCUS_MODE_PATTERN.test(pathname)) {
    return (
      <AuthorizationGate sections={STUDENT_NAV} restrictTo="student">
        {children}
      </AuthorizationGate>
    );
  }

  return (
    <AuthorizationGate sections={STUDENT_NAV} restrictTo="student">
      <DashboardShell
        sections={STUDENT_NAV}
        portalLabel="Student"
        rootHref={ROUTES.dashboard.root}
        breadcrumb={
          pathname && SELF_BREADCRUMB_PATTERN.test(pathname) ? undefined : (
            <PageBreadcrumb items={crumbs} />
          )
        }
        title={isRoot ? crumbs.at(-1)?.label : undefined}
        hasPermission={can}
        badgeFor={(item) =>
          item.href === ROUTES.dashboard.payments && (pendingPaymentsCount ?? 0) > 0
            ? { label: String(pendingPaymentsCount), variant: 'warning' }
            : undefined
        }
      >
        {children}
      </DashboardShell>
    </AuthorizationGate>
  );
}
