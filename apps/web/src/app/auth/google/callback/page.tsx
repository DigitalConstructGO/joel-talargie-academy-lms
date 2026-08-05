'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
export default function GoogleCallbackPage() {
  const router = useRouter();
  const handle = useAuthStore((state) => state.handleGoogleCallback);
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('access_token');
    if (!token) {
      router.replace('/auth/login?error=google');
      return;
    }
    window.history.replaceState({}, '', window.location.pathname);
    void handle(token)
      .then(() => router.replace('/dashboard'))
      .catch(() => router.replace('/auth/login?error=google'));
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
