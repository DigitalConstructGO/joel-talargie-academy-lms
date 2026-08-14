'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminPaymentsApi } from '../api/admin-payments.api';
import type {
  AdminPaymentListParams,
  ApprovePaymentInput,
  DeclinePaymentInput,
  PaymentActivityParams,
} from '../types/admin-payment.types';

const ADMIN_PAYMENTS_ROOT = ['admin-payments'] as const;

const adminPaymentKeys = {
  all: ADMIN_PAYMENTS_ROOT,
  lists: () => [...ADMIN_PAYMENTS_ROOT, 'list'] as const,
  list: (params: AdminPaymentListParams) => [...ADMIN_PAYMENTS_ROOT, 'list', params] as const,
  count: (params: AdminPaymentListParams = {}) => [...ADMIN_PAYMENTS_ROOT, 'count', params] as const,
  detail: (paymentId: string) => [...ADMIN_PAYMENTS_ROOT, 'detail', paymentId] as const,
  receipt: (paymentId: string) => [...ADMIN_PAYMENTS_ROOT, 'receipt', paymentId] as const,
  activity: (paymentId: string, params: PaymentActivityParams) =>
    [...ADMIN_PAYMENTS_ROOT, 'activity', paymentId, params] as const,
};

export function useAdminPayments(params: AdminPaymentListParams = {}) {
  return useQuery({
    queryKey: adminPaymentKeys.list(params),
    queryFn: () => adminPaymentsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

/** Number of payments awaiting review - drives the sidebar "Payments" badge. */
export function usePendingPaymentsCount() {
  return useQuery({
    queryKey: adminPaymentKeys.count({ status: 'PENDING' }),
    queryFn: () => adminPaymentsApi.count({ status: 'PENDING' }),
    select: (data) => data.count,
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
      void queryClient.invalidateQueries({ queryKey: adminPaymentKeys.count() });
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
      void queryClient.invalidateQueries({ queryKey: adminPaymentKeys.count() });
      void queryClient.invalidateQueries({
        queryKey: adminPaymentKeys.detail(variables.paymentId),
      });
    },
  });
}
