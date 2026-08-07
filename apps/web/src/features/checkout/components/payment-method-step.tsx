'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertTriangle, Building2, Landmark, Loader2, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/common/file-upload';
import { useSubmitPayment } from '@/features/payments/hooks/use-payments';
import type {
  PaymentInstructions,
  SubmitPaymentResult,
} from '@/features/payments/types/payment.types';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { buildMethodContent } from '../constants/payment-method-content';
import {
  PAYMENT_METHODS,
  type PaymentMethodId,
  type SubmittedPaymentSummary,
} from '../types/checkout.types';

const METHOD_ICONS: Record<PaymentMethodId, typeof Smartphone> = {
  TELEBIRR: Smartphone,
  CBE_BIRR: Landmark,
  CHAPA: Wallet,
  BANK_TRANSFER: Building2,
};

const paymentFormSchema = z.object({
  transactionId: z.string().trim().min(3, 'Enter the transaction ID from your payment.'),
  submittedAmount: z
    .string()
    .trim()
    .min(1, 'Enter the amount you paid.')
    .refine((value) => Number(value) > 0, 'Enter a valid amount.'),
  paymentDate: z.string().optional(),
  studentNote: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentMethodStepProps {
  enrollmentId: string;
  instructions: PaymentInstructions | undefined;
  isLoadingInstructions: boolean;
  onSubmitted: (result: SubmitPaymentResult, summary: SubmittedPaymentSummary) => void;
  onBack: () => void;
}

export function PaymentMethodStep({
  enrollmentId,
  instructions,
  isLoadingInstructions,
  onSubmitted,
  onBack,
}: PaymentMethodStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('TELEBIRR');
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const submitPayment = useSubmitPayment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      transactionId: '',
      submittedAmount: '',
      paymentDate: '',
      studentNote: '',
    },
  });

  useEffect(() => {
    if (instructions)
      reset((current) => ({ ...current, submittedAmount: instructions.expectedAmount }));
  }, [instructions, reset]);

  const content = useMemo(
    () => (instructions ? buildMethodContent(selectedMethod, instructions) : null),
    [selectedMethod, instructions],
  );

  async function onSubmit(values: PaymentFormValues) {
    const receipt = receiptFiles[0];
    if (!receipt) {
      setReceiptError('Upload your payment receipt to continue.');
      return;
    }
    setReceiptError(null);

    const methodLabel = PAYMENT_METHODS.find((method) => method.id === selectedMethod)?.label ?? '';
    const studentNote = [`[${methodLabel}]`, values.studentNote?.trim()].filter(Boolean).join(' ');

    try {
      const result = await submitPayment.mutateAsync({
        enrollmentId,
        input: {
          transactionId: values.transactionId.trim(),
          submittedAmount: values.submittedAmount.trim(),
          currency: instructions?.currency ?? 'ETB',
          paymentDate: values.paymentDate || undefined,
          studentNote: studentNote || undefined,
          receipt,
        },
      });
      onSubmitted(result, {
        transactionId: values.transactionId.trim(),
        submittedAmount: values.submittedAmount.trim(),
        currency: instructions?.currency ?? 'ETB',
        paymentDate: values.paymentDate || undefined,
        methodLabel,
        receiptFileName: receipt.name,
      });
    } catch {
      toast.error('Could not submit your payment.', 'Please check the details and try again.');
    }
  }

  if (isLoadingInstructions || !instructions || !content) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-full bg-primary/10" />
        <div className="h-40 animate-pulse rounded-xl bg-primary/10" />
        <div className="h-64 animate-pulse rounded-xl bg-primary/10" />
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-lg font-bold text-foreground">Choose a payment method</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay {formatCurrency(instructions.expectedAmount, instructions.currency)} using any of the
          options below, then upload your receipt to confirm.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PAYMENT_METHODS.map((method) => {
          const Icon = METHOD_ICONS[method.id];
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                isSelected
                  ? 'border-brand bg-brand/5'
                  : 'border-border bg-card hover:border-brand/40',
              )}
              aria-pressed={isSelected}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full',
                  isSelected ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-semibold text-foreground">{method.label}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {PAYMENT_METHODS.find((method) => method.id === selectedMethod)?.label} instructions
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{content.tagline}</p>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {content.fields.map((field) => (
              <div key={field.label}>
                <dt className="text-muted-foreground">{field.label}</dt>
                <dd className="font-medium text-foreground">{field.value}</dd>
              </div>
            ))}
          </dl>

          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {content.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
            {instructions.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          {instructions.referenceInstructions && (
            <p className="text-sm text-muted-foreground">{instructions.referenceInstructions}</p>
          )}

          {content.securityNotice && (
            <p className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-sm text-info">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {content.securityNotice}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-bold text-foreground">Confirm your payment</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transactionId">{content.transactionIdLabel}</Label>
              <Input
                id="transactionId"
                {...register('transactionId')}
                placeholder={content.transactionIdPlaceholder}
              />
              {errors.transactionId && (
                <p className="text-sm text-destructive">{errors.transactionId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="submittedAmount">Amount paid ({instructions.currency})</Label>
              <Input
                id="submittedAmount"
                type="number"
                step="0.01"
                {...register('submittedAmount')}
              />
              {errors.submittedAmount && (
                <p className="text-sm text-destructive">{errors.submittedAmount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment date (optional)</Label>
              <Input id="paymentDate" type="date" {...register('paymentDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentNote">Note for the reviewer (optional)</Label>
            <Textarea
              id="studentNote"
              rows={2}
              {...register('studentNote')}
              placeholder="Anything the reviewer should know about this payment"
            />
          </div>

          <div className="space-y-2">
            <Label>Payment receipt</Label>
            <FileUpload
              onFilesSelected={(files) => {
                setReceiptFiles(files);
                if (files.length > 0) setReceiptError(null);
              }}
              accept={{
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png'],
                'image/webp': ['.webp'],
                'application/pdf': ['.pdf'],
              }}
              maxSizeBytes={instructions.receipt.maximumSizeMb * 1024 * 1024}
              maxFiles={1}
            />
            {receiptError && <p className="text-sm text-destructive">{receiptError}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitPayment.isPending}>
          Back
        </Button>
        <Button type="submit" disabled={submitPayment.isPending}>
          {submitPayment.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Submit payment
        </Button>
      </div>
    </form>
  );
}
