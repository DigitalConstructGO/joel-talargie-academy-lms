'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { ContentContainer } from '@/components/layout/content-container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Legacy standalone Security page.
 * Security settings are now integrated into the unified Profile & Security page.
 */
export default function AdminSecurityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.admin.systemProfile);
  }, [router]);

  return (
    <ContentContainer>
      <div className="space-y-4 py-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </ContentContainer>
  );
}
