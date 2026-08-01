import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';
export const metadata: Metadata = {
  title: 'Joel Talargie Academy',
  description: 'Digital Construct learning management system',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
