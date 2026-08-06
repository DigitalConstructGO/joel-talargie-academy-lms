'use client';

import { useEffect } from 'react';
import { ContentContainer } from '@/components/layout/content-container';
import { DashboardServerErrorState } from '@/components/dashboard/error-states';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ContentContainer>
      <DashboardServerErrorState onRetry={reset} />
    </ContentContainer>
  );
}
