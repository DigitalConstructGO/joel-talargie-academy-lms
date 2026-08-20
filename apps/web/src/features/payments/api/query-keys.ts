import type { PaymentListParams } from '../types/payment.types';

const PAYMENTS_ROOT = ['payments'] as const;

export const paymentKeys = {
  all: PAYMENTS_ROOT,
  lists: () => [...PAYMENTS_ROOT, 'list'] as const,
  list: (params: PaymentListParams) => [...PAYMENTS_ROOT, 'list', params] as const,
  count: (params: PaymentListParams = {}) => [...PAYMENTS_ROOT, 'count', params] as const,
  detail: (paymentId: string) => [...PAYMENTS_ROOT, 'detail', paymentId] as const,
  receipt: (paymentId: string) => [...PAYMENTS_ROOT, 'receipt', paymentId] as const,
  instructions: (enrollmentId: string) => [...PAYMENTS_ROOT, 'instructions', enrollmentId] as const,
};
