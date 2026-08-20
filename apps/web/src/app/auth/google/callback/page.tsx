'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { resolvePostLoginRedirect, consumeGoogleRedirect } from '@/lib/authorization/redirect';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';

type CallbackStage = 'verifying' | 'securing' | 'redirecting' | 'error';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const handle = useAuthStore((state) => state.handleGoogleCallback);
  const processed = useRef(false);
  const [stage, setStage] = useState<CallbackStage>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;

    const hash = window.location.hash.slice(1);
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash);

    const token = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    const redirectParam = consumeGoogleRedirect();

    if (!token) {
      setStage('error');
      setErrorMessage('No authentication token received from Google.');
      const timeout = setTimeout(() => {
        router.replace(`${ROUTES.auth.login}?error=google`);
      }, 2500);
      return () => clearTimeout(timeout);
    }

    processed.current = true;
    window.history.replaceState({}, '', window.location.pathname);

    setStage('securing');

    void handle(token, refreshToken)
      .then(() => {
        setStage('redirecting');
        const destination = resolvePostLoginRedirect(
          redirectParam,
          useAuthStore.getState().user?.roles ?? [],
        );
        setTimeout(() => {
          router.replace(destination);
        }, 600);
      })
      .catch((err) => {
        setStage('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to finalize your Google session.',
        );
        setTimeout(() => {
          router.replace(`${ROUTES.auth.login}?error=google`);
        }, 3000);
      });
  }, [handle, router]);

  const stageDetails: Record<CallbackStage, { title: string; subtitle: string; progress: number }> =
    {
      verifying: {
        title: 'Verifying Google credentials...',
        subtitle: 'Validating single sign-on response with Google.',
        progress: 35,
      },
      securing: {
        title: 'Securing your session...',
        subtitle: 'Syncing your profile, roles, and permissions.',
        progress: 75,
      },
      redirecting: {
        title: 'Session ready!',
        subtitle: 'Taking you to your learning portal now...',
        progress: 100,
      },
      error: {
        title: 'Authentication Error',
        subtitle: errorMessage || 'Could not complete Google sign-in. Returning to login...',
        progress: 100,
      },
    };

  const current = stageDetails[stage];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card/80 p-8 text-center shadow-xl backdrop-blur-sm">
        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-40 w-40 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
        />

        {/* Dynamic Icon Badge */}
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-brand/10 ring-8 ring-brand/5 transition-transform duration-300">
          {stage === 'error' ? (
            <AlertCircle className="size-8 text-destructive animate-in zoom-in-75 duration-200" />
          ) : stage === 'redirecting' ? (
            <ShieldCheck className="size-8 text-success animate-in zoom-in-90 duration-300" />
          ) : (
            <Loader2 className="size-8 animate-spin text-brand" />
          )}
        </div>

        {/* Heading & description */}
        <h1 className="text-xl font-bold tracking-tight text-foreground transition-all duration-200">
          {current.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground transition-all duration-200">
          {current.subtitle}
        </p>

        {/* Progress bar */}
        {stage !== 'error' ? (
          <div className="mt-6 w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
                style={{ width: `${current.progress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-brand animate-pulse" />
              <span>Secured with OAuth 2.0</span>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <Button variant="outline" size="sm" onClick={() => router.replace(ROUTES.auth.login)}>
              Return to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
