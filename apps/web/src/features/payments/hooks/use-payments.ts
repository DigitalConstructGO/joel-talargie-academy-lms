'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments.api';
import { paymentKeys } from '../api/query-keys';
import type { PaymentListParams, SubmitPaymentInput } from '../types/payment.types';

export function useMyPayments(params: PaymentListParams = {}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.listMine(params),
  });
}

export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: paymentKeys.detail(paymentId),
    queryFn: () => paymentsApi.detail(paymentId),
    enabled: Boolean(paymentId),
  });
}

export function usePaymentReceipt(paymentId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.receipt(paymentId ?? ''),
    queryFn: () => paymentsApi.receipt(paymentId!),
    enabled: Boolean(paymentId),
  });
}

export function usePaymentInstructions(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.instructions(enrollmentId ?? ''),
    queryFn: () => paymentsApi.instructions(enrollmentId!),
    enabled: Boolean(enrollmentId),
  });
}

export function useSubmitPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, input }: { enrollmentId: string; input: SubmitPaymentInput }) =>
      paymentsApi.submit(enrollmentId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
