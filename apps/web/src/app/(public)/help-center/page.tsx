import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { HelpCenterContent } from '@/features/support/components/help-center-content';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Guides and answers to help you get the most out of the platform.',
};

export default function HelpCenterPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <PageHeader title="Help center" description="Search our guides, or browse by topic below." />

      <HelpCenterContent />

      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 px-6 py-10 text-center">
        <h2 className="text-lg font-semibold text-foreground">Still need help?</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Check our full FAQ list or reach out to our team directly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.faq}
            className="flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            View FAQ
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href={ROUTES.contact}
            className="flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Contact us
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
