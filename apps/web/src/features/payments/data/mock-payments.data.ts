import { MOCK_COURSE_RECORDS } from '@/features/catalog/data/build-mock-courses';
import type { Payment } from '../types/payment.types';

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

interface PaymentSeed {
  courseIndex: number;
  enrollmentId: string;
  status: Payment['status'];
  daysAgoSubmitted: number;
  daysAgoReviewed?: number;
  declineReason?: string;
  paymentMethod?: {
    id: string;
    name: string;
    code: string;
    type: NonNullable<Payment['paymentMethodType']>;
  };
}

const PAYMENT_SEEDS: PaymentSeed[] = [
  {
    courseIndex: 4,
    enrollmentId: 'enrollment-003',
    status: 'APPROVED',
    daysAgoSubmitted: 20,
    daysAgoReviewed: 19,
    paymentMethod: {
      id: 'method-telebirr',
      name: 'Telebirr',
      code: 'TELEBIRR',
      type: 'MOBILE_MONEY',
    },
  },
  {
    courseIndex: 10,
    enrollmentId: 'enrollment-006',
    status: 'APPROVED',
    daysAgoSubmitted: 60,
    daysAgoReviewed: 58,
    paymentMethod: {
      id: 'method-bank-transfer',
      name: 'Bank Transfer',
      code: 'BANK_TRANSFER',
      type: 'BANK_TRANSFER',
    },
  },
  {
    courseIndex: 8,
    enrollmentId: 'enrollment-005',
    status: 'PENDING',
    daysAgoSubmitted: 2,
    paymentMethod: { id: 'method-chapa', name: 'Chapa', code: 'CHAPA', type: 'CARD' },
  },
];

function buildPayment(seed: PaymentSeed, index: number): Payment | null {
  const record = MOCK_COURSE_RECORDS[seed.courseIndex];
  if (!record) return null;
  const amount = record.discountPrice ?? record.price;
  return {
    id: `payment-${String(index + 1).padStart(3, '0')}`,
    enrollmentId: seed.enrollmentId,
    courseId: record.id,
    courseTitle: record.title,
    attemptNumber: 1,
    transactionId: `TXN-${String(1000 + index)}`,
    submittedAmount: amount,
    expectedAmount: amount,
    currency: record.currency,
    paymentMethodId: seed.paymentMethod?.id ?? null,
    paymentMethodName: seed.paymentMethod?.name ?? null,
    paymentMethodCode: seed.paymentMethod?.code ?? null,
    paymentMethodType: seed.paymentMethod?.type ?? null,
    paymentDate: daysAgo(seed.daysAgoSubmitted),
    studentNote: null,
    status: seed.status,
    amountMismatch: false,
    declineReason: seed.declineReason ?? null,
    submittedAt: daysAgo(seed.daysAgoSubmitted),
    reviewedAt: seed.daysAgoReviewed !== undefined ? daysAgo(seed.daysAgoReviewed) : null,
    promoCode: null,
    promoDiscountType: null,
    promoDiscountValue: null,
    promoOriginalAmount: null,
    promoDiscountAmount: null,
    promoFinalAmount: null,
  };
}

export const MOCK_PAYMENTS: Payment[] = PAYMENT_SEEDS.map(buildPayment).filter(
  (payment): payment is Payment => payment !== null,
);
