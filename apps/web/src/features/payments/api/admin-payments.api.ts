import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAdminPaymentsApi } from '../data/mock-admin-payments.api';
import type {
  AdminPayment,
  AdminPaymentListParams,
  AdminPaymentListResult,
  ApprovePaymentInput,
  DeclinePaymentInput,
  PaymentActivityEntry,
  PaymentActivityParams,
} from '../types/admin-payment.types';
import type { PaymentCount, PaymentReceiptUrl } from '../types/payment.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const liveAdminPaymentsApi = {
  list: async (params: AdminPaymentListParams = {}) =>
    unwrap<AdminPaymentListResult>(
      await authClient.get('/admin/payments', { params: cleanParams(params) }),
    ),

  count: async (params: AdminPaymentListParams = {}) =>
    unwrap<PaymentCount>(
      await authClient.get('/admin/payments/count', { params: cleanParams(params) }),
    ),

  detail: async (paymentId: string) =>
    unwrap<AdminPayment>(await authClient.get(`/admin/payments/${encodeURIComponent(paymentId)}`)),

  receipt: async (paymentId: string) =>
    unwrap<PaymentReceiptUrl>(
      await authClient.get(`/admin/payments/${encodeURIComponent(paymentId)}/receipt`),
    ),

  approve: async (paymentId: string, input: ApprovePaymentInput) =>
    unwrap<AdminPayment>(
      await authClient.post(`/admin/payments/${encodeURIComponent(paymentId)}/approve`, input),
    ),

  decline: async (paymentId: string, input: DeclinePaymentInput) =>
    unwrap<AdminPayment>(
      await authClient.post(`/admin/payments/${encodeURIComponent(paymentId)}/decline`, input),
    ),

  activity: async (paymentId: string, params: PaymentActivityParams = {}) =>
    unwrap<PaymentActivityEntry[]>(
      await authClient.get(`/admin/payments/${encodeURIComponent(paymentId)}/activity`, {
        params: cleanParams(params),
      }),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const adminPaymentsApi =
  CATALOG_DATA_SOURCE === 'live' ? liveAdminPaymentsApi : mockAdminPaymentsApi;
