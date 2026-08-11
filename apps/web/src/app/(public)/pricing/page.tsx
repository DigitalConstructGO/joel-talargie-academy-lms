import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gift, Tag, Infinity as InfinityIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/page-header';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'How pricing works on our platform - simple, one-time, per-course pricing.',
};

const PRICING_FAQ = [
  {
    question: 'Do you offer subscriptions?',
    answer: 'No. Every course is priced individually and paid for once, with lifetime access.',
  },
  {
    question: 'Are there really free courses?',
    answer: 'Yes - many courses are free to enroll in and complete, no payment required.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'Payment options are shown at checkout when you enroll in a paid course.',
  },
];

async function loadPriceRange() {
  try {
    const [cheapest, priciest, freeCourses, paidCourses] = await Promise.all([
      catalogApi.listCourses({ accessType: 'PAID', sort: 'price_asc', pageSize: 1 }),
      catalogApi.listCourses({ accessType: 'PAID', sort: 'price_desc', pageSize: 1 }),
      catalogApi.listCourses({ accessType: 'FREE', pageSize: 1 }),
      catalogApi.listCourses({ accessType: 'PAID', pageSize: 1 }),
    ]);
    return {
      lowest: cheapest.items[0] ?? null,
      highest: priciest.items[0] ?? null,
      freeCount: freeCourses.total,
      paidCount: paidCourses.total,
    };
  } catch {
    return { lowest: null, highest: null, freeCount: 0, paidCount: 0 };
  }
}

export default async function PricingPage() {
  const { lowest, highest, freeCount, paidCount } = await loadPriceRange();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6">
      <PageHeader
        title="Pricing"
        description="No subscriptions or hidden fees - just simple, one-time, per-course pricing."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
            <Gift className="size-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">Free courses</h3>
          <p className="text-sm text-muted-foreground">
            {freeCount} free {freeCount === 1 ? 'course is' : 'courses are'} available right now,
            with no payment required.
          </p>
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Tag className="size-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">Paid courses</h3>
          <p className="text-sm text-muted-foreground">
            {paidCount} paid {paidCount === 1 ? 'course' : 'courses'}
            {lowest && highest
              ? `, ranging from ${formatCurrency(lowest.discountPrice ?? lowest.price, lowest.currency)} to ${formatCurrency(highest.discountPrice ?? highest.price, highest.currency)}.`
              : '.'}
          </p>
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-info/10 text-info">
            <InfinityIcon className="size-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">Lifetime access</h3>
          <p className="text-sm text-muted-foreground">
            Once you enroll, the course is yours to revisit any time, with no expiration.
          </p>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button size="lg" asChild>
          <Link href={ROUTES.courses.list}>
            Browse courses
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <h2 className="mb-4 text-center text-xl font-semibold text-foreground">Pricing FAQ</h2>
        <FaqAccordion items={PRICING_FAQ} />
      </div>
    </div>
  );
}
