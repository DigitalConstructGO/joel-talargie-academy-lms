import { MOCK_ADMIN_PAYMENTS } from './mock-admin-payments.data';
import type {
  AdminPayment,
  AdminPaymentListParams,
  AdminPaymentListResult,
  ApprovePaymentInput,
  DeclinePaymentInput,
  PaymentActivityEntry,
  PaymentActivityParams,
} from '../types/admin-payment.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

const store: AdminPayment[] = MOCK_ADMIN_PAYMENTS.map((entry) => ({ ...entry }));

export const mockAdminPaymentsApi = {
  list: async (params: AdminPaymentListParams = {}): Promise<AdminPaymentListResult> => {
    const filtered = store.filter((payment) => {
      if (params.status && payment.status !== params.status) return false;
      if (params.courseId && payment.courseId !== params.courseId) return false;
      if (params.paymentMethodId && payment.paymentMethodId !== params.paymentMethodId)
        return false;
      if (params.amountMismatch !== undefined && payment.amountMismatch !== params.amountMismatch)
        return false;
      if (params.duplicateOnly && payment.duplicateTransactionCount === 0) return false;
      if (params.submittedFrom && payment.submittedAt < params.submittedFrom) return false;
      if (params.submittedTo && payment.submittedAt > params.submittedTo) return false;
      if (params.search) {
        const needle = params.search.toLowerCase();
        if (
          !payment.transactionId.toLowerCase().includes(needle) &&
          !payment.studentEmail.toLowerCase().includes(needle) &&
          !payment.courseTitle.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay(filtered.slice(start, start + pageSize));
  },

  detail: async (paymentId: string): Promise<AdminPayment> => {
    const payment = store.find((entry) => entry.id === paymentId);
    if (!payment) notFound('Payment not found');
    return delay(payment);
  },

  receipt: async (paymentId: string) => {
    const payment = store.find((entry) => entry.id === paymentId);
    if (!payment) notFound('Payment not found');
    return delay({
      url: '/images/hero/network-abstract.jpg',
      expiresInSeconds: 300,
      originalFileName: `receipt-${payment.transactionId}.jpg`,
      mimeType: 'image/jpeg',
      fileSize: 245_000,
    });
  },

  approve: async (paymentId: string, _input: ApprovePaymentInput): Promise<AdminPayment> => {
    const payment = store.find((entry) => entry.id === paymentId);
    if (!payment) notFound('Payment not found');
    payment.status = 'APPROVED';
    payment.reviewedAt = new Date().toISOString();
    return delay(payment);
  },

  decline: async (paymentId: string, input: DeclinePaymentInput): Promise<AdminPayment> => {
    const payment = store.find((entry) => entry.id === paymentId);
    if (!payment) notFound('Payment not found');
    payment.status = 'DECLINED';
    payment.declineReason = input.reason;
    payment.reviewNote = input.reviewNote ?? null;
    payment.reviewedAt = new Date().toISOString();
    return delay(payment);
  },

  activity: async (
    _paymentId: string,
    _params: PaymentActivityParams,
  ): Promise<PaymentActivityEntry[]> => delay([]),
};
