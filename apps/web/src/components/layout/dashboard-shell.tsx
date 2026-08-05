'use client';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import type { NavSection } from '@/types';

export interface DashboardShellProps {
  sections: NavSection[];
  portalLabel: string;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}

/** Shared shell for the admin and student dashboard layouts - a collapsible sidebar, sticky header, and scrollable content area. */
export function DashboardShell({
  sections,
  portalLabel,
  breadcrumb,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar sections={sections} portalLabel={portalLabel} />
      <SidebarInset>
        <SiteHeader breadcrumb={breadcrumb} />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
