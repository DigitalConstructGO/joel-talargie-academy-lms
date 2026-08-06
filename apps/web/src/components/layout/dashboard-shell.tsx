'use client';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { DashboardFooter } from '@/components/layout/dashboard-footer';
import { useCommandPaletteState } from '@/components/dashboard/command-palette';
import { DashboardPageTransition } from '@/components/dashboard/dashboard-page-transition';
import type { NavSection } from '@/types';

export interface DashboardShellProps {
  sections: NavSection[];
  portalLabel: string;
  /** The section's own overview page (e.g. `/dashboard`) - passed through to AppSidebar for active-route matching. */
  rootHref: string;
  breadcrumb?: React.ReactNode;
  /** Page title shown in the header - only the dashboard/admin home pages set this. */
  title?: string;
  children: React.ReactNode;
}

/** Shared shell for the admin and student dashboard layouts - a collapsible sidebar, sticky header, and scrollable content area. */
export function DashboardShell({
  sections,
  portalLabel,
  rootHref,
  breadcrumb,
  title,
  children,
}: DashboardShellProps) {
  const { open, setOpen } = useCommandPaletteState();

  return (
    <SidebarProvider>
      <AppSidebar sections={sections} portalLabel={portalLabel} rootHref={rootHref} />
      <SidebarInset>
        <SiteHeader
          breadcrumb={breadcrumb}
          title={title}
          sections={sections}
          commandPaletteOpen={open}
          onCommandPaletteOpenChange={setOpen}
        />
        <main className="flex flex-1 flex-col">
          <DashboardPageTransition>{children}</DashboardPageTransition>
        </main>
        <DashboardFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
