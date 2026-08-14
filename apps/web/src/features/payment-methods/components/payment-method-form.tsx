'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { extractFieldErrors } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';
import type {
  CreatePaymentMethodInput,
  PaymentMethodType,
  UpdatePaymentMethodInput,
} from '../types/payment-method.types';

const TYPE_OPTIONS: { label: string; value: PaymentMethodType }[] = [
  { label: 'Mobile money', value: 'MOBILE_MONEY' },
  { label: 'Bank transfer', value: 'BANK_TRANSFER' },
  { label: 'Card', value: 'CARD' },
  { label: 'Other', value: 'OTHER' },
];

const paymentMethodSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name for this payment method.'),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Enter a unique code.')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Use uppercase letters, numbers, and underscores only.'),
  type: z.enum(['MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER']),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(10000),
  isActive: z.boolean(),
  tagline: z.string().trim().max(300).optional(),
  transactionIdLabel: z.string().trim().max(100).optional(),
  transactionIdPlaceholder: z.string().trim().max(100).optional(),
  tips: z.string().optional(),
  securityNotice: z.string().trim().max(500).optional(),
  config: z.string().optional(),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

const DEFAULT_VALUES: PaymentMethodFormValues = {
  name: '',
  code: '',
  type: 'MOBILE_MONEY',
  description: '',
  sortOrder: 0,
  isActive: true,
  tagline: '',
  transactionIdLabel: '',
  transactionIdPlaceholder: '',
  tips: '',
  securityNotice: '',
  config: '{}',
};

interface PaymentMethodFormProps {
  mode: 'create' | 'edit';
  initial?: {
    name: string;
    code: string;
    type: PaymentMethodType;
    description?: string | null;
    sortOrder: number;
    isActive: boolean;
    instructions?: {
      tagline?: string;
      tips?: string[];
      securityNotice?: string;
      transactionIdLabel?: string;
      transactionIdPlaceholder?: string;
    };
    config?: Record<string, unknown>;
  };
  isSubmitting: boolean;
  onSubmit: (input: CreatePaymentMethodInput | UpdatePaymentMethodInput) => Promise<void> | void;
  onCancel: () => void;
}

export function PaymentMethodForm({
  mode,
  initial,
  isSubmitting,
  onSubmit,
  onCancel,
}: PaymentMethodFormProps) {
  const [configError, setConfigError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!initial) {
      reset(DEFAULT_VALUES);
      return;
    }
    reset({
      name: initial.name,
      code: initial.code,
      type: initial.type,
      description: initial.description ?? '',
      sortOrder: initial.sortOrder,
      isActive: initial.isActive,
      tagline: initial.instructions?.tagline ?? '',
      transactionIdLabel: initial.instructions?.transactionIdLabel ?? '',
      transactionIdPlaceholder: initial.instructions?.transactionIdPlaceholder ?? '',
      tips: initial.instructions?.tips?.join('\n') ?? '',
      securityNotice: initial.instructions?.securityNotice ?? '',
      config: JSON.stringify(initial.config ?? {}, null, 2),
    });
  }, [initial, reset]);

  const type = watch('type');

  function parseConfig(raw: string | undefined): Record<string, unknown> {
    if (!raw?.trim()) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('Config must be a JSON object.');
      return parsed as Record<string, unknown>;
    } catch (error) {
      const message =
        error instanceof Error && error.message !== 'Unexpected token'
          ? error.message
          : 'Enter valid JSON.';
      throw new Error(message);
    }
  }

  async function onValidSubmit(values: PaymentMethodFormValues) {
    setConfigError(null);
    let config: Record<string, unknown>;
    try {
      config = parseConfig(values.config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON config.';
      setConfigError(message);
      return;
    }
    const instructions = {
      ...(values.tagline ? { tagline: values.tagline } : {}),
      ...(values.transactionIdLabel ? { transactionIdLabel: values.transactionIdLabel } : {}),
      ...(values.transactionIdPlaceholder
        ? { transactionIdPlaceholder: values.transactionIdPlaceholder }
        : {}),
      ...(values.tips?.trim()
        ? {
            tips: values.tips
              .split('\n')
              .map((tip) => tip.trim())
              .filter(Boolean),
          }
        : {}),
      ...(values.securityNotice ? { securityNotice: values.securityNotice } : {}),
    };
    try {
      await onSubmit({
        name: values.name,
        description: values.description || undefined,
        type: values.type,
        sortOrder: values.sortOrder,
        instructions,
        config,
        ...(mode === 'create'
          ? {
              code: values.code,
              isActive: values.isActive,
            }
          : {}),
      } as CreatePaymentMethodInput | UpdatePaymentMethodInput);
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors.length > 0) {
        for (const { field, message } of fieldErrors) {
          if (['name', 'code', 'type', 'description', 'sortOrder'].includes(field))
            setError(field as keyof PaymentMethodFormValues, { message });
        }
      }
      toast.error('Could not save the payment method.', 'Please review the details and try again.');
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onValidSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Basics</CardTitle>
          <CardDescription>
            Display name, type, and how students will find this method.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Telebirr" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="code">Unique code</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="e.g. TELEBIRR"
                className="uppercase"
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setValue('type', value as PaymentMethodType)}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              {...register('sortOrder', { valueAsNumber: true })}
            />
            {errors.sortOrder && (
              <p className="text-sm text-destructive">{errors.sortOrder.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              {...register('description')}
              placeholder="One or two sentences shown to students."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          {mode === 'create' && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Active at checkout</Label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Student instructions</CardTitle>
          <CardDescription>
            Public guidance shown at checkout. Keep it short and specific to this method.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              {...register('tagline')}
              placeholder="Short subtitle for this method"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactionIdLabel">Transaction ID label</Label>
            <Input
              id="transactionIdLabel"
              {...register('transactionIdLabel')}
              placeholder="e.g. Telebirr transaction ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactionIdPlaceholder">Transaction ID placeholder</Label>
            <Input
              id="transactionIdPlaceholder"
              {...register('transactionIdPlaceholder')}
              placeholder="e.g. ABC1D2E3F4"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tips">Tips (one per line)</Label>
            <Textarea
              id="tips"
              rows={4}
              {...register('tips')}
              placeholder={
                'Open the app and choose "Send Money".\nDouble-check the recipient name.'
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="securityNotice">Security notice (optional)</Label>
            <Textarea
              id="securityNotice"
              rows={2}
              {...register('securityNotice')}
              placeholder="e.g. Never share your PIN with anyone."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Private configuration</CardTitle>
          <CardDescription>
            Stored securely and never shown to students. Use a JSON object for merchant keys or
            internal settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="config">Config (JSON)</Label>
          <Textarea
            id="config"
            rows={6}
            {...register('config')}
            className="font-mono text-xs"
            spellCheck={false}
          />
          {configError && <p className="text-sm text-destructive">{configError}</p>}
          {errors.config && <p className="text-sm text-destructive">{errors.config.message}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {mode === 'create' ? 'Create payment method' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
