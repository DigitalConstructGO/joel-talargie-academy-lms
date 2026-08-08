'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarSkeleton } from '@/components/dashboard/skeletons/sidebar-skeleton';
import { HeaderSkeleton } from '@/components/dashboard/skeletons/header-skeleton';
import { DashboardSkeleton } from '@/components/dashboard/skeletons/dashboard-skeleton';
import { StatusPage } from '@/components/common/status-page';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { isRouteAllowed, collectPermissions } from '@/lib/authorization/nav-permissions';
import { isStudent, getPostLoginRoute } from '@/lib/authorization/user-type';
import { buildLoginRedirect } from '@/lib/authorization/redirect';
import { ROUTES } from '@/constants/routes';
import type { NavSection } from '@/types';

/** Mirrors `DashboardShell`'s sidebar + header + content proportions while auth/permissions are still loading. */
function DashboardShellSkeleton() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="shadow-sidebar">
        <SidebarContent className="p-2">
          <SidebarSkeleton />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <HeaderSkeleton className="h-16" />
        <main className="flex flex-1 flex-col p-4 sm:p-6">
          <DashboardSkeleton />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export interface AuthorizationGateProps {
  sections: NavSection[];
  /** Pass for `/admin` only - requires at least one admin-nav permission even on routes with no specific `permission` field (e.g. the admin dashboard root). Omit for portals that should stay open by default, like the student dashboard. */
  requirePortalAccess?: boolean;
  /**
   * Restricts this whole portal to students-only or staff-only (see
   * `isStudent`), independent of nav permissions - this is an "area" check
   * (which portal does this account belong in), separate from the
   * fine-grained permission check `isRouteAllowed` already does within an
   * area. A mismatch here bounces the user to their correct portal root
   * rather than a generic `/403`, since it means they're not in the wrong
   * *page*, they're in the wrong *app*.
   */
  restrictTo?: 'student' | 'staff';
  children: React.ReactNode;
}

/**
 * UX-layer authorization gate: keeps the sidebar/content unmounted until
 * permissions are confirmed (avoids flashing unauthorized nav items or
 * content on refresh), then either renders `children` or redirects. This
 * is presentation only - the real security boundary is the backend's
 * `PermissionsGuard`, which enforces the same permissions on every API
 * call regardless of what this component decides.
 *
 * Hydration and session recovery are handled once, app-wide, by
 * `useAuthBootstrap` (mounted in `AppProviders`) - this component only
 * reacts to the resulting `sessionChecked`/`authenticated`/`authzStatus`
 * state, it doesn't fetch anything itself except a manual retry on error.
 */
export function AuthorizationGate({
  sections,
  requirePortalAccess,
  restrictTo,
  children,
}: AuthorizationGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const sessionChecked = useAuthStore((state) => state.sessionChecked);
  const authenticated = useAuthStore((state) => state.authenticated);
  const authzStatus = useAuthStore((state) => state.authzStatus);
  const permissions = useAuthStore((state) => state.permissions);
  const roles = useAuthStore((state) => state.roles);
  const isAdministrator = useAuthStore((state) => state.isAdministrator);
  const fetchAuthorization = useAuthStore((state) => state.fetchAuthorization);

  useEffect(() => {
    if (hasHydrated && sessionChecked && !authenticated) {
      router.replace(buildLoginRedirect(pathname));
    }
  }, [hasHydrated, sessionChecked, authenticated, pathname, router]);

  const ready = sessionChecked && authenticated && authzStatus === 'ready';
  const roleAllowed = ready
    ? !restrictTo || (restrictTo === 'student' ? isStudent(roles) : !isStudent(roles))
    : null;
  const permissionAllowed =
    ready && roleAllowed
      ? isRouteAllowed(pathname, sections, permissions, {
          isAdministrator,
          fallbackPermissions: requirePortalAccess ? collectPermissions(sections) : undefined,
        })
      : null;

  useEffect(() => {
    if (roleAllowed === false) router.replace(getPostLoginRoute(roles));
    else if (permissionAllowed === false) router.replace(ROUTES.forbidden);
  }, [roleAllowed, permissionAllowed, roles, router]);

  if (sessionChecked && authenticated && authzStatus === 'error') {
    return (
      <StatusPage
        icon={AlertTriangle}
        title="Couldn't load your permissions"
        description="Something went wrong while checking your access. Please try again."
        action={<Button onClick={() => fetchAuthorization()}>Try again</Button>}
      />
    );
  }

  if (!ready || roleAllowed !== true || permissionAllowed !== true) {
    return <DashboardShellSkeleton />;
  }

  return <>{children}</>;
}
