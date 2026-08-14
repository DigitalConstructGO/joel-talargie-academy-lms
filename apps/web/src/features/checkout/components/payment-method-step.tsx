'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertTriangle, Landmark, Loader2, Smartphone, Wallet, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/common/file-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { extractFieldErrors } from '@/lib/api/api-error';
import { useSubmitPayment } from '@/features/payments/hooks/use-payments';
import type {
  PaymentInstructions,
  SubmitPaymentResult,
} from '@/features/payments/types/payment.types';
import type { PaymentMethodType } from '@/features/payment-methods/types/payment-method.types';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { buildMethodContent } from '../constants/payment-method-content';
import type { SubmittedPaymentSummary } from '../types/checkout.types';

const METHOD_ICONS: Record<PaymentMethodType, typeof Smartphone> = {
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: Landmark,
  CARD: Wallet,
  OTHER: Wrench,
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
  const methods = useMemo(() => instructions?.paymentMethods ?? [], [instructions]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(methods[0]?.id ?? null);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const submitPayment = useSubmitPayment();

  const {
    register,
    handleSubmit,
    reset,
    setError,
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

  // Default to the first (highest sort order) method once instructions arrive.
  useEffect(() => {
    if (methods.length > 0 && !methods.some((method) => method.id === selectedMethodId)) {
      const first = methods[0];
      if (first) setSelectedMethodId(first.id);
    }
  }, [methods, selectedMethodId]);

  const selectedMethod = methods.find((method) => method.id === selectedMethodId) ?? methods[0];
  const content = useMemo(
    () =>
      instructions && selectedMethod ? buildMethodContent(selectedMethod, instructions) : null,
    [selectedMethod, instructions],
  );

  async function onSubmit(values: PaymentFormValues) {
    const receipt = receiptFiles[0];
    if (!selectedMethod) return;
    if (!receipt) {
      setReceiptError('Upload your payment receipt to continue.');
      return;
    }
    setReceiptError(null);

    const studentNote = [`[${selectedMethod.name}]`, values.studentNote?.trim()]
      .filter(Boolean)
      .join(' ');

    try {
      const result = await submitPayment.mutateAsync({
        enrollmentId,
        input: {
          transactionId: values.transactionId.trim(),
          submittedAmount: values.submittedAmount.trim(),
          currency: instructions?.currency ?? 'ETB',
          paymentMethodId: selectedMethod.id,
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
        methodName: selectedMethod.name,
        receiptFileName: receipt.name,
      });
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors.length > 0) {
        for (const { field, message } of fieldErrors) {
          setError(field as keyof PaymentFormValues, { message });
        }
      }
      toast.error('Could not submit your payment.', 'Please check the details and try again.');
    }
  }

  if (isLoadingInstructions || !instructions || !content || !selectedMethod) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-full bg-primary/10" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
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
        {methods.map((method) => {
          const Icon = METHOD_ICONS[method.type];
          const isSelected = selectedMethod.id === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethodId(method.id)}
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
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{method.name}</span>
                {method.instructions.tagline && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {method.instructions.tagline}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {selectedMethod.name} instructions
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
