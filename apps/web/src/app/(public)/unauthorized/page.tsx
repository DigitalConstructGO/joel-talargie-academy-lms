import type { Metadata } from 'next';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { StatusPage } from '@/components/common/status-page';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = { title: 'Sign in required' };

export default function UnauthorizedPage() {
  return (
    <StatusPage
      icon={LogIn}
      code="401"
      title="Sign in required"
      description="You need to sign in to access this page."
      action={
        <Button asChild>
          <Link href={ROUTES.auth.login}>Sign in</Link>
        </Button>
      }
    />
  );
}
