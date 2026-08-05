import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, LifeBuoy, MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { ContactForm } from '@/features/support/components/contact-form';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with our team.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <PageHeader title="Contact us" description="Have a question? Send us a message." />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <ContactForm />
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex items-start gap-3 p-5">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">General inquiries</h3>
              <p className="text-sm text-muted-foreground">
                Use the form for any questions about courses or your account.
              </p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 p-5">
            <HelpCircle className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Common questions</h3>
              <p className="text-sm text-muted-foreground">
                Check our{' '}
                <Link href={ROUTES.faq} className="text-brand underline-offset-4 hover:underline">
                  FAQ
                </Link>{' '}
                first - it may already have your answer.
              </p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 p-5">
            <LifeBuoy className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Need more help?</h3>
              <p className="text-sm text-muted-foreground">
                Visit the{' '}
                <Link
                  href={ROUTES.helpCenter}
                  className="text-brand underline-offset-4 hover:underline"
                >
                  Help Center
                </Link>{' '}
                for guides and troubleshooting.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
