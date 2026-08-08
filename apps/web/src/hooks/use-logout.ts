'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { toast } from '@/lib/toast';

/**
 * Signs the current user out and redirects to `/`, with toast feedback. The
 * redirect happens before the network call resolves (see below), so there's
 * no meaningful window to show a spinner in - `inFlight` instead guards
 * against a double-click firing two `/auth/logout` requests before the
 * first one's navigation has a chance to unmount the trigger.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const inFlight = useRef(false);

  return async function handleLogout() {
    if (inFlight.current) return;
    inFlight.current = true;
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
      // Drop every cached query (payments, sessions, profile, etc.) so a
      // different account signing in on the same browser never briefly
      // sees the previous user's data before queries refetch.
      queryClient.clear();
      toast.success('Signed out');
    } catch {
      toast.error('Could not sign out', 'Please try again.');
    } finally {
      inFlight.current = false;
    }
  };
}
