import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';
import { JsonLd } from '@/components/common/json-ld';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/json-ld';
import { siteConfig } from '@/config/site.config';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontHeading = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'Joel Talargie Academy',
    template: '%s · Joel Talargie Academy',
  },
  description: 'Digital Construct learning management system',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontHeading.variable}`}
    >
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla's
          cz-shortcut-listen attribute) inject attributes onto <body> before
          React hydrates - a known false-positive class of mismatch, not an
          app bug (see the "browser extension" case in React's own
          hydration-mismatch warning). Same rationale as <html> above. */}
      <body suppressHydrationWarning>
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
