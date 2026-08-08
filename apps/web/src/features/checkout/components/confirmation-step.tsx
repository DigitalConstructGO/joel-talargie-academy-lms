import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';

interface ConfirmationStepProps {
  courseTitle: string;
  /** `true` when the course was free and enrollment completed immediately (no payment review needed). */
  isFreeEnrollment: boolean;
  /** The selected payment method's label, e.g. "Telebirr" - omitted for free enrollments. */
  methodLabel?: string;
}

export function ConfirmationStep({
  courseTitle,
  isFreeEnrollment,
  methodLabel,
}: ConfirmationStepProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          {isFreeEnrollment ? <CheckCircle2 className="size-9" /> : <Clock className="size-9" />}
        </span>

        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isFreeEnrollment ? "You're enrolled!" : 'Payment submitted for review'}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {isFreeEnrollment
              ? `You now have full access to "${courseTitle}". Jump in whenever you're ready.`
              : `We've received your ${methodLabel ? `${methodLabel} ` : ''}payment for "${courseTitle}". An admin will verify it shortly - you'll get a notification once it's approved.`}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={ROUTES.dashboard.courses}>Go to My Courses</Link>
          </Button>
          {!isFreeEnrollment && (
            <Button asChild size="lg" variant="outline">
              <Link href={ROUTES.dashboard.payments}>View Payments</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
