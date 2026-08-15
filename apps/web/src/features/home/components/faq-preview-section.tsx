import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { FAQ_ITEMS } from '@/constants/faq-content';
import { ROUTES } from '@/constants/routes';
import type { FaqItem } from '@/features/settings/types/settings.types';

export function FaqPreviewSection({ items }: { items?: FaqItem[] }) {
  const displayItems =
    items && items.length > 0
      ? items.slice(0, 6).map((f) => ({
          question: f.question,
          answer: f.answer,
          category: f.category,
        }))
      : FAQ_ITEMS.slice(0, 4);

  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
        </div>
        <FaqAccordion items={displayItems} />
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" asChild>
            <Link href={ROUTES.faq}>
              View all FAQs
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
