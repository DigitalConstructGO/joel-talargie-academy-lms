'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { STUDENT_NAV } from '@/constants/nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      sections={STUDENT_NAV}
      portalLabel="Student"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      {children}
    </DashboardShell>
  );
}
