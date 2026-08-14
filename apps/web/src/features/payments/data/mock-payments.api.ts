import { MOCK_COURSE_RECORDS } from '@/features/catalog/data/build-mock-courses';
import { MOCK_PAYMENT_METHODS } from '@/features/payment-methods/data/mock-payment-methods.data';
import { MOCK_PAYMENTS } from './mock-payments.data';
import type {
  Payment,
  PaymentCount,
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

interface DemoPaymentEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  priceSnapshot: string;
  discountSnapshot: string | null;
  currencySnapshot: string;
}

function demoEnrollment(courseIndex: number, id: string): DemoPaymentEnrollment | null {
  const record = MOCK_COURSE_RECORDS[courseIndex];
  if (!record) return null;
  return {
    id,
    courseId: record.id,
    courseTitle: record.title,
    priceSnapshot: record.price,
    discountSnapshot: record.discountPrice,
    currencySnapshot: record.currency,
  };
}

const DEMO_ENROLLMENTS: DemoPaymentEnrollment[] = [
  demoEnrollment(4, 'enrollment-003'),
  demoEnrollment(10, 'enrollment-006'),
  demoEnrollment(8, 'enrollment-005'),
].filter((entry): entry is DemoPaymentEnrollment => entry !== null);

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
    const enrollment = DEMO_ENROLLMENTS.find((entry) => entry.id === enrollmentId);
    if (!enrollment) notFound('Enrollment not found');
    const amount = enrollment.discountSnapshot ?? enrollment.priceSnapshot;
    const latest = store.find((payment) => payment.enrollmentId === enrollmentId) ?? null;
    return delay({
      enrollmentId,
      course: { id: enrollment.courseId, title: enrollment.courseTitle },
      expectedAmount: amount,
      currency: enrollment.currencySnapshot,
      paymentMethods: MOCK_PAYMENT_METHODS.filter((entry) => entry.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ id, code, name, description, type, sortOrder, instructions }) => ({
          id,
          code,
          name,
          description,
          type,
          sortOrder,
          instructions,
        })),
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
    const enrollment = DEMO_ENROLLMENTS.find((entry) => entry.id === enrollmentId);
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
      paymentMethodId: input.paymentMethodId,
      paymentMethodName: null,
      paymentMethodCode: null,
      paymentMethodType: null,
      paymentDate: input.paymentDate ?? null,
      studentNote: input.studentNote?.trim() || null,
      status: 'PENDING',
      amountMismatch:
        input.submittedAmount !== (enrollment.discountSnapshot ?? enrollment.priceSnapshot),
      declineReason: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      promoCode: null,
      promoDiscountType: null,
      promoDiscountValue: null,
      promoOriginalAmount: null,
      promoDiscountAmount: null,
      promoFinalAmount: null,
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

  countMine: async (params: PaymentListParams = {}): Promise<PaymentCount> =>
    delay({ count: filterPayments(params).length }),

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
