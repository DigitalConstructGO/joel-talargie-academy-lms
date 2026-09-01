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

import { PricingPageContent } from '@/features/pricing/components/pricing-page-content';

export default async function PricingPage() {
  const { lowest, highest, freeCount, paidCount } = await loadPriceRange();

  return (
    <PricingPageContent
      lowest={lowest}
      highest={highest}
      freeCount={freeCount}
      paidCount={paidCount}
    />
  );
}
