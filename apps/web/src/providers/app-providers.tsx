'use client';
import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthBootstrap } from '@/components/auth/auth-bootstrap';
import { NotificationSocketProvider } from '@/providers/notification-socket-provider';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const content = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        themes={['light', 'dark']}
        disableTransitionOnChange
      >
        {/* Makes every framer-motion animation site-wide (Reveal, page transitions, etc.) honor the OS-level reduced-motion preference, not just new usages. */}
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={200}>
            <AuthBootstrap />
            <NotificationSocketProvider>{children}</NotificationSocketProvider>
            <Toaster position="top-right" richColors closeButton expand />
          </TooltipProvider>
        </MotionConfig>
      </ThemeProvider>
    </QueryClientProvider>
  );
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return clientId ? (
    <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider>
  ) : (
    content
  );
}
