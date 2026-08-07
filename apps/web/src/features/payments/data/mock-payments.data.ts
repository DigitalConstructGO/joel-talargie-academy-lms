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
}

const PAYMENT_SEEDS: PaymentSeed[] = [
  {
    courseIndex: 4,
    enrollmentId: 'enrollment-003',
    status: 'APPROVED',
    daysAgoSubmitted: 20,
    daysAgoReviewed: 19,
  },
  {
    courseIndex: 10,
    enrollmentId: 'enrollment-006',
    status: 'APPROVED',
    daysAgoSubmitted: 60,
    daysAgoReviewed: 58,
  },
  { courseIndex: 8, enrollmentId: 'enrollment-005', status: 'PENDING', daysAgoSubmitted: 2 },
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
    paymentDate: daysAgo(seed.daysAgoSubmitted),
    studentNote: null,
    status: seed.status,
    amountMismatch: false,
    declineReason: seed.declineReason ?? null,
    submittedAt: daysAgo(seed.daysAgoSubmitted),
    reviewedAt: seed.daysAgoReviewed !== undefined ? daysAgo(seed.daysAgoReviewed) : null,
  };
}

export const MOCK_PAYMENTS: Payment[] = PAYMENT_SEEDS.map(buildPayment).filter(
  (payment): payment is Payment => payment !== null,
);
