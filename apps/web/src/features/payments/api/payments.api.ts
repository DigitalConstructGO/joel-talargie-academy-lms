import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockPaymentsApi } from '../data/mock-payments.api';
import type {
  Payment,
  PaymentInstructions,
  PaymentListParams,
  PaymentListResult,
  PaymentReceiptUrl,
  SubmitPaymentInput,
  SubmitPaymentResult,
} from '../types/payment.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

function toFormData(input: SubmitPaymentInput): FormData {
  const form = new FormData();
  form.set('transactionId', input.transactionId);
  form.set('submittedAmount', input.submittedAmount);
  form.set('currency', input.currency);
  form.set('paymentMethodId', input.paymentMethodId);
  if (input.paymentDate) form.set('paymentDate', input.paymentDate);
  if (input.studentNote) form.set('studentNote', input.studentNote);
  form.set('receipt', input.receipt);
  return form;
}

/** Talks to the real backend's authenticated payment endpoints (manual receipt review, not a gateway integration). */
const livePaymentsApi = {
  instructions: async (enrollmentId: string) =>
    unwrap<PaymentInstructions>(
      await authClient.get(
        `/me/enrollments/${encodeURIComponent(enrollmentId)}/payment-instructions`,
      ),
    ),

  submit: async (enrollmentId: string, input: SubmitPaymentInput) =>
    unwrap<SubmitPaymentResult>(
      await authClient.post(
        `/me/enrollments/${encodeURIComponent(enrollmentId)}/payments`,
        toFormData(input),
        {
          headers: { 'Content-Type': undefined },
        },
      ),
    ),

  listMine: async (params: PaymentListParams = {}) =>
    unwrap<PaymentListResult>(
      await authClient.get('/me/payments', { params: cleanParams(params) }),
    ),

  detail: async (paymentId: string) =>
    unwrap<Payment>(await authClient.get(`/me/payments/${encodeURIComponent(paymentId)}`)),

  receipt: async (paymentId: string) =>
    unwrap<PaymentReceiptUrl>(
      await authClient.get(`/me/payments/${encodeURIComponent(paymentId)}/receipt`),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const paymentsApi = CATALOG_DATA_SOURCE === 'live' ? livePaymentsApi : mockPaymentsApi;
