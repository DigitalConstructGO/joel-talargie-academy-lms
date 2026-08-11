import Link from 'next/link';
import { ArrowRight, Gift, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function PricingPreviewSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Simple, per-course pricing
        </h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
          No subscriptions. Pay once for a course and keep lifetime access.
        </p>
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
            <Gift className="size-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">Free courses</h3>
          <p className="text-sm text-muted-foreground">
            Many courses are completely free to enroll in and complete.
          </p>
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Tag className="size-5" />
          </span>
          <h3 className="text-base font-semibold text-foreground">Paid courses</h3>
          <p className="text-sm text-muted-foreground">
            Pay a one-time price set by the instructor for lifetime access, no recurring fees.
          </p>
        </Card>
      </div>
      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <Link href={ROUTES.pricing}>
            Learn more about pricing
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
