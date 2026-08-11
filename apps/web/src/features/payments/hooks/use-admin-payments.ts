'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminPaymentsApi } from '../api/admin-payments.api';
import type {
  AdminPaymentListParams,
  ApprovePaymentInput,
  DeclinePaymentInput,
  PaymentActivityParams,
} from '../types/admin-payment.types';

const adminPaymentKeys = {
  all: ['admin-payments'] as const,
  lists: () => [...adminPaymentKeys.all, 'list'] as const,
  list: (params: AdminPaymentListParams) => [...adminPaymentKeys.lists(), params] as const,
  detail: (paymentId: string) => [...adminPaymentKeys.all, 'detail', paymentId] as const,
  receipt: (paymentId: string) => [...adminPaymentKeys.all, 'receipt', paymentId] as const,
  activity: (paymentId: string, params: PaymentActivityParams) =>
    [...adminPaymentKeys.all, 'activity', paymentId, params] as const,
};

export function useAdminPayments(params: AdminPaymentListParams = {}) {
  return useQuery({
    queryKey: adminPaymentKeys.list(params),
    queryFn: () => adminPaymentsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminPayment(paymentId: string) {
  return useQuery({
    queryKey: adminPaymentKeys.detail(paymentId),
    queryFn: () => adminPaymentsApi.detail(paymentId),
    enabled: Boolean(paymentId),
  });
}

export function useAdminPaymentReceipt(paymentId: string | undefined) {
  return useQuery({
    queryKey: adminPaymentKeys.receipt(paymentId ?? ''),
    queryFn: () => adminPaymentsApi.receipt(paymentId!),
    enabled: Boolean(paymentId),
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: ApprovePaymentInput }) =>
      adminPaymentsApi.approve(paymentId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminPaymentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: adminPaymentKeys.detail(variables.paymentId),
      });
    },
  });
}

export function useDeclinePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: DeclinePaymentInput }) =>
      adminPaymentsApi.decline(paymentId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminPaymentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: adminPaymentKeys.detail(variables.paymentId),
      });
    },
  });
}
