import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockPaymentMethodsApi } from '../data/mock-payment-methods.api';
import type {
  AdminPaymentMethod,
  CreatePaymentMethodInput,
  PaymentMethodListParams,
  PaymentMethodListResult,
  UpdatePaymentMethodInput,
} from '../types/payment-method.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const livePaymentMethodsApi = {
  list: async (params: PaymentMethodListParams = {}): Promise<PaymentMethodListResult> =>
    unwrap<PaymentMethodListResult>(
      await authClient.get('/admin/payment-methods', { params: cleanParams(params) }),
    ),

  detail: async (paymentMethodId: string): Promise<AdminPaymentMethod> =>
    unwrap<AdminPaymentMethod>(
      await authClient.get(`/admin/payment-methods/${encodeURIComponent(paymentMethodId)}`),
    ),

  create: async (input: CreatePaymentMethodInput): Promise<AdminPaymentMethod> =>
    unwrap<AdminPaymentMethod>(await authClient.post('/admin/payment-methods', input)),

  update: async (
    paymentMethodId: string,
    input: UpdatePaymentMethodInput,
  ): Promise<AdminPaymentMethod> =>
    unwrap<AdminPaymentMethod>(
      await authClient.patch(
        `/admin/payment-methods/${encodeURIComponent(paymentMethodId)}`,
        input,
      ),
    ),

  setActive: async (paymentMethodId: string, isActive: boolean): Promise<AdminPaymentMethod> =>
    unwrap<AdminPaymentMethod>(
      await authClient.patch(
        `/admin/payment-methods/${encodeURIComponent(paymentMethodId)}/status`,
        { isActive },
      ),
    ),

  remove: async (paymentMethodId: string): Promise<{ deleted: true }> =>
    unwrap<{ deleted: true }>(
      await authClient.delete(`/admin/payment-methods/${encodeURIComponent(paymentMethodId)}`),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const paymentMethodsApi =
  CATALOG_DATA_SOURCE === 'live' ? livePaymentMethodsApi : mockPaymentMethodsApi;
