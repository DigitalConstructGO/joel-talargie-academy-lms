'use client';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { CommandPalette, useCommandPaletteState } from '@/components/dashboard/command-palette';
import { DashboardPageTransition } from '@/components/dashboard/dashboard-page-transition';
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
  const { open, setOpen } = useCommandPaletteState();

  return (
    <SidebarProvider>
      <AppSidebar sections={sections} portalLabel={portalLabel} />
      <SidebarInset>
        <SiteHeader breadcrumb={breadcrumb} onOpenCommandPalette={() => setOpen(true)} />
        <main className="flex flex-1 flex-col">
          <DashboardPageTransition>{children}</DashboardPageTransition>
        </main>
      </SidebarInset>
      <CommandPalette sections={sections} open={open} onOpenChange={setOpen} />
    </SidebarProvider>
  );
}
