import type { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { StatusPage } from '@/components/common/status-page';

export const metadata: Metadata = { title: 'Access denied' };

export default function ForbiddenPage() {
  return (
    <StatusPage
      icon={ShieldAlert}
      code="403"
      title="Access denied"
      description="You don't have permission to view this page."
    />
  );
}
