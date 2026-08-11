import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { FAQ_ITEMS } from '@/constants/faq-content';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about courses, enrollment, and your account.',
};

export default function FaqPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <PageHeader title="Frequently asked questions" description="Answers to common questions." />
      <FaqAccordion items={FAQ_ITEMS} />
    </div>
  );
}
