import { Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { SubmitPaymentResult } from '@/features/payments/types/payment.types';
import { formatCurrency } from '@/lib/format';
import type { SubmittedPaymentSummary } from '../types/checkout.types';

interface PaymentReceiptStepProps {
  result: SubmitPaymentResult;
  summary: SubmittedPaymentSummary;
  onNext: () => void;
}

export function PaymentReceiptStep({ result, summary, onNext }: PaymentReceiptStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Review your submission</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what was submitted for review. You&apos;ll be notified once an admin verifies
          it.
        </p>
      </div>

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
              <dd className="font-medium text-foreground">{summary.methodLabel}</dd>
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

      <Button size="lg" className="w-full sm:w-auto" onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
