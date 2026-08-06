'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { toast } from '@/lib/toast';

/** Signs the current user out and redirects to `/`, with toast feedback. */
export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return async function handleLogout() {
    // Navigate first, run the actual `/auth/logout` call after: this
    // unmounts `AuthorizationGate` (only ever mounted under `/dashboard`
    // and `/admin`, never under `/`) before the store's `authenticated`
    // flips to `false`, which is what stops the gate's own "confirmed
    // unauthenticated -> go to login" effect from racing this redirect and
    // winning (landing the user on `/auth/login` instead of `/`). The
    // store still briefly reports `authenticated: true` for the duration
    // of the network call, so a public page's navbar could show the
    // authenticated state for a beat after clicking Logout before
    // flipping - harmless, and unavoidable without blocking the click on
    // network latency.
    router.replace(ROUTES.home);
    try {
      await logout();
      toast.success('Signed out');
    } catch {
      toast.error('Could not sign out', 'Please try again.');
    }
  };
}
