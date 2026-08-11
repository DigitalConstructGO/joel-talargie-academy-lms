import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { StatusPage } from '@/components/common/status-page';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="flex-1">
        <StatusPage
          icon={SearchX}
          code="404"
          title="Page not found"
          description="The page you're looking for doesn't exist or may have been moved."
          action={
            <Button asChild>
              <Link href={ROUTES.courses.list}>Browse courses</Link>
            </Button>
          }
        />
      </div>
      <PublicFooter />
    </div>
  );
}
