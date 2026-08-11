'use client';

import { useEffect } from 'react';
import { AlertOctagon } from 'lucide-react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { StatusPage } from '@/components/common/status-page';
import { Button } from '@/components/ui/button';

export default function GlobalError({
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
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="flex-1">
        <StatusPage
          icon={AlertOctagon}
          code="500"
          title="Something went wrong"
          description="An unexpected error occurred on our end. Please try again."
          action={<Button onClick={reset}>Try again</Button>}
        />
      </div>
      <PublicFooter />
    </div>
  );
}
