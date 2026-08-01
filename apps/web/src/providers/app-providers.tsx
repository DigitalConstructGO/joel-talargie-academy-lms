'use client';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
export function AppProviders({ children }: { children: React.ReactNode }) {
  const content = (
    <ThemeProvider attribute="class">
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return clientId ? (
    <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider>
  ) : (
    content
  );
}
