'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ADMIN_NAV } from '@/constants/nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      sections={ADMIN_NAV}
      portalLabel="Administrator"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Administrator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      {children}
    </DashboardShell>
  );
}
