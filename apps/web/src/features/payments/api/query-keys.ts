import type { PaymentListParams } from '../types/payment.types';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params: PaymentListParams) => [...paymentKeys.lists(), params] as const,
  detail: (paymentId: string) => [...paymentKeys.all, 'detail', paymentId] as const,
  receipt: (paymentId: string) => [...paymentKeys.all, 'receipt', paymentId] as const,
  instructions: (enrollmentId: string) =>
    [...paymentKeys.all, 'instructions', enrollmentId] as const,
};
