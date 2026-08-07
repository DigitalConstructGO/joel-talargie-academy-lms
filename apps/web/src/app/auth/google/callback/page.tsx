'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { resolvePostLoginRedirect, consumeGoogleRedirect } from '@/lib/authorization/redirect';
import { ROUTES } from '@/constants/routes';
export default function GoogleCallbackPage() {
  const router = useRouter();
  const handle = useAuthStore((state) => state.handleGoogleCallback);
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('access_token');
    const redirectParam = consumeGoogleRedirect();
    if (!token) {
      router.replace(`${ROUTES.auth.login}?error=google`);
      return;
    }
    window.history.replaceState({}, '', window.location.pathname);
    void handle(token)
      .then(() =>
        router.replace(
          resolvePostLoginRedirect(redirectParam, useAuthStore.getState().user?.roles ?? []),
        ),
      )
      .catch(() => router.replace(`${ROUTES.auth.login}?error=google`));
  }, [handle, router]);
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-medium text-foreground">Completing Google sign-in...</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Please wait while we secure your session.
      </p>
    </div>
  );
}
