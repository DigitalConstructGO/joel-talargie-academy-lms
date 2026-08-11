'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Runs once, app-wide (mounted via `AuthBootstrap` inside `AppProviders`,
 * which wraps every route - public and protected). Waits for the zustand
 * `persist` middleware to finish rehydrating, then either accepts an
 * already-authenticated persisted session or makes exactly one silent
 * `refresh()` attempt to recover a session whose access token was lost
 * (e.g. localStorage cleared) but whose httpOnly refresh-token cookie is
 * still valid. This hook NEVER navigates anywhere - an anonymous visitor
 * on `/courses` with no session at all is a completely normal state. Only
 * `AuthorizationGate` (mounted solely inside the two protected layouts)
 * turns "confirmed not authenticated" into a redirect.
 *
 * Once the outcome is known it flips `sessionChecked`, the single shared
 * signal both this hook and `AuthorizationGate` read to agree the initial
 * check has settled, without either duplicating the `refresh()` call.
 *
 * Separately (and reactively, not just on mount), whenever the store is
 * authenticated and `authzStatus` is `'idle'`, this fetches
 * `/auth/authorization` - this is what makes `roles`/`permissions`
 * available on public pages too, fixing the navbar's `isStudent([])`
 * vacuous-truth bug for a signed-in, browse-only visitor. It also
 * naturally re-fires after a fresh login (`login()`/`handleGoogleCallback()`
 * reset `authzStatus` to `'idle'`) since this hook stays mounted for the
 * app's whole lifetime.
 */
export function useAuthBootstrap() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const sessionChecked = useAuthStore((state) => state.sessionChecked);
  const authenticated = useAuthStore((state) => state.authenticated);
  const authzStatus = useAuthStore((state) => state.authzStatus);
  const attempted = useRef(false);

  useEffect(() => {
    if (!hasHydrated || sessionChecked) return;
    if (authenticated) {
      useAuthStore.getState().setSessionChecked(true);
      return;
    }
    if (attempted.current) return;
    attempted.current = true;
    void useAuthStore
      .getState()
      .refresh()
      .finally(() => useAuthStore.getState().setSessionChecked(true));
  }, [hasHydrated, sessionChecked, authenticated]);

  useEffect(() => {
    if (authenticated && authzStatus === 'idle') {
      void useAuthStore.getState().fetchAuthorization();
    }
  }, [authenticated, authzStatus]);
}
