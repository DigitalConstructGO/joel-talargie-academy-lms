import { MOCK_ENROLLMENTS } from '@/features/enrollments/data/mock-enrollments.data';
import { MOCK_PAYMENTS } from './mock-payments.data';
import type {
  Payment,
  PaymentInstructions,
  PaymentListParams,
  PaymentListResult,
  PaymentReceiptUrl,
  SubmitPaymentInput,
  SubmitPaymentResult,
} from '../types/payment.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

let store: Payment[] = MOCK_PAYMENTS.map((payment) => ({ ...payment }));

function filterPayments(params: PaymentListParams) {
  return store
    .filter((payment) => {
      if (params.status && payment.status !== params.status) return false;
      if (params.courseId && payment.courseId !== params.courseId) return false;
      if (params.search) {
        const needle = params.search.toLowerCase();
        if (
          !payment.courseTitle.toLowerCase().includes(needle) &&
          !payment.transactionId.toLowerCase().includes(needle)
        )
          return false;
      }
      if (params.submittedFrom && payment.submittedAt < params.submittedFrom) return false;
      if (params.submittedTo && payment.submittedAt > params.submittedTo) return false;
      return true;
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export const mockPaymentsApi = {
  instructions: async (enrollmentId: string): Promise<PaymentInstructions> => {
    const enrollment = MOCK_ENROLLMENTS.find((entry) => entry.id === enrollmentId);
    if (!enrollment) notFound('Enrollment not found');
    const amount = enrollment.discountSnapshot ?? enrollment.priceSnapshot;
    const latest = store.find((payment) => payment.enrollmentId === enrollmentId) ?? null;
    return delay({
      enrollmentId,
      course: { id: enrollment.courseId, title: enrollment.courseTitle },
      expectedAmount: amount,
      currency: enrollment.currencySnapshot,
      bank: {
        name: 'Joel Talargie Academy Bank',
        accountName: 'Joel Talargie Academy',
        accountNumber: '1000-2345-6789',
        branch: 'Bole Branch',
      },
      instructions: [
        'Transfer the exact amount shown above.',
        'Use your enrollment ID as the payment reference if possible.',
        'Upload a clear photo or PDF of your receipt below.',
      ],
      referenceInstructions: `Reference: ${enrollmentId}`,
      supportContact: 'support@joeltalargieacademy.com',
      receipt: {
        maximumSizeMb: 12,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      },
      latestPayment: latest
        ? { id: latest.id, status: latest.status, attemptNumber: latest.attemptNumber }
        : null,
    });
  },

  submit: async (enrollmentId: string, input: SubmitPaymentInput): Promise<SubmitPaymentResult> => {
    const enrollment = MOCK_ENROLLMENTS.find((entry) => entry.id === enrollmentId);
    if (!enrollment) notFound('Enrollment not found');
    const attemptNumber =
      store.filter((payment) => payment.enrollmentId === enrollmentId).length + 1;
    const payment: Payment = {
      id: `payment-${Date.now()}`,
      enrollmentId,
      courseId: enrollment.courseId,
      courseTitle: enrollment.courseTitle,
      attemptNumber,
      transactionId: input.transactionId,
      submittedAmount: input.submittedAmount,
      expectedAmount: enrollment.discountSnapshot ?? enrollment.priceSnapshot,
      currency: input.currency,
      paymentDate: input.paymentDate ?? null,
      studentNote: input.studentNote?.trim() || null,
      status: 'PENDING',
      amountMismatch:
        input.submittedAmount !== (enrollment.discountSnapshot ?? enrollment.priceSnapshot),
      declineReason: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    };
    store = [payment, ...store];
    return delay({
      id: payment.id,
      attemptNumber: payment.attemptNumber,
      status: payment.status,
      amountMismatch: payment.amountMismatch,
      enrollmentStatus: 'WAITING_APPROVAL',
    });
  },

  listMine: async (params: PaymentListParams = {}): Promise<PaymentListResult> => {
    const filtered = filterPayments(params);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay(filtered.slice(start, start + pageSize));
  },

  detail: async (paymentId: string): Promise<Payment> => {
    const payment = store.find((entry) => entry.id === paymentId);
    if (!payment) notFound('Payment not found');
    return delay(payment);
  },

  receipt: async (paymentId: string): Promise<PaymentReceiptUrl> => {
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
};
