'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { toast } from '@/lib/toast';

/** Signs the current user out and redirects to login, with toast feedback. */
export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return async function handleLogout() {
    try {
      await logout();
      toast.success('Signed out');
      router.replace(ROUTES.auth.login);
    } catch {
      toast.error('Could not sign out', 'Please try again.');
    }
  };
}
