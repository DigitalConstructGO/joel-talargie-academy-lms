import Link from 'next/link';
import { CheckCircle2, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import type { SubmitPaymentResult } from '@/features/payments/types/payment.types';
import { formatCurrency } from '@/lib/format';
import type { SubmittedPaymentSummary } from '../types/checkout.types';

interface ConfirmationStepProps {
  courseTitle: string;
  /** `true` when the course was free and enrollment completed immediately (no payment review needed). */
  isFreeEnrollment: boolean;
  /** Present for paid courses after a payment is submitted - shows the review summary. */
  result?: SubmitPaymentResult | null;
  /** Present for paid courses after a payment is submitted - shows the review summary. */
  summary?: SubmittedPaymentSummary | null;
}

export function ConfirmationStep({
  courseTitle,
  isFreeEnrollment,
  result,
  summary,
}: ConfirmationStepProps) {
  return (
    <div className="space-y-6">
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
                : `We've received your ${summary?.methodName ? `${summary.methodName} ` : ''}payment for "${courseTitle}". An admin will verify it shortly - you'll get a notification once it's approved.`}
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

      {!isFreeEnrollment && result && summary && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="size-4 text-warning" /> Awaiting review
              </span>
              <Badge variant="warning">Attempt #{result.attemptNumber}</Badge>
            </div>

            <Separator />

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Payment method</dt>
                <dd className="font-medium text-foreground">{summary.methodName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium text-foreground">{summary.transactionId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Amount paid</dt>
                <dd className="font-medium text-foreground">
                  {formatCurrency(summary.submittedAmount, summary.currency)}
                </dd>
              </div>
              {summary.paymentDate && (
                <div>
                  <dt className="text-muted-foreground">Payment date</dt>
                  <dd className="font-medium text-foreground">{summary.paymentDate}</dd>
                </div>
              )}
            </dl>

            <Separator />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4 shrink-0" />
              <span className="truncate">{summary.receiptFileName}</span>
            </div>

            {result.amountMismatch && (
              <p className="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
                The amount you entered doesn&apos;t match the expected price. This won&apos;t block
                review, but may take a little longer to verify.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
