import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
export default function Page() {
  return (
    <Suspense>
      <AuthForm kind="reset" />
    </Suspense>
  );
}
