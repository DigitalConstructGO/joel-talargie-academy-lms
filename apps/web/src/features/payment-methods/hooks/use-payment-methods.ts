'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentMethodsApi } from '../api/payment-methods.api';
import type {
  CreatePaymentMethodInput,
  PaymentMethodListParams,
  UpdatePaymentMethodInput,
} from '../types/payment-method.types';

const paymentMethodKeys = {
  all: ['admin-payment-methods'] as const,
  lists: () => [...paymentMethodKeys.all, 'list'] as const,
  list: (params: PaymentMethodListParams) => [...paymentMethodKeys.lists(), params] as const,
  detail: (paymentMethodId: string) =>
    [...paymentMethodKeys.all, 'detail', paymentMethodId] as const,
};

export function usePaymentMethods(params: PaymentMethodListParams = {}) {
  return useQuery({
    queryKey: paymentMethodKeys.list(params),
    queryFn: () => paymentMethodsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function usePaymentMethod(paymentMethodId: string) {
  return useQuery({
    queryKey: paymentMethodKeys.detail(paymentMethodId),
    queryFn: () => paymentMethodsApi.detail(paymentMethodId),
    enabled: Boolean(paymentMethodId),
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentMethodInput) => paymentMethodsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodKeys.lists() });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentMethodId,
      input,
    }: {
      paymentMethodId: string;
      input: UpdatePaymentMethodInput;
    }) => paymentMethodsApi.update(paymentMethodId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.detail(variables.paymentMethodId),
      });
    },
  });
}

export function useSetPaymentMethodStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentMethodId, isActive }: { paymentMethodId: string; isActive: boolean }) =>
      paymentMethodsApi.setActive(paymentMethodId, isActive),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.detail(variables.paymentMethodId),
      });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) => paymentMethodsApi.remove(paymentMethodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodKeys.lists() });
    },
  });
}
