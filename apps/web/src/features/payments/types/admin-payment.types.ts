import type { PaymentMethodType } from '@/features/payment-methods/types/payment-method.types';
import type { PaymentStatus } from './payment.types';

export interface AdminPayment {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  attemptNumber: number;
  transactionId: string;
  submittedAmount: string;
  expectedAmount: string;
  currency: string;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  paymentMethodCode: string | null;
  paymentMethodType: PaymentMethodType | null;
  paymentDate: string | null;
  studentNote: string | null;
  status: PaymentStatus;
  amountMismatch: boolean;
  duplicateTransactionCount: number;
  declineReason: string | null;
  reviewNote: string | null;
  mismatchApprovalReason: string | null;
  reviewerId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

/** `GET /admin/payments` returns a bare array - no `total` - same "load more" shape as the student side. */
export type AdminPaymentListResult = AdminPayment[];

export interface AdminPaymentListParams {
  page?: number;
  pageSize?: number;
  status?: PaymentStatus;
  courseId?: string;
  paymentMethodId?: string;
  search?: string;
  submittedFrom?: string;
  submittedTo?: string;
  amountMismatch?: boolean;
  duplicateOnly?: boolean;
}

export interface ApprovePaymentInput {
  reviewNote?: string;
  mismatchApprovalReason?: string;
  acknowledgeDuplicate?: boolean;
}

export interface DeclinePaymentInput {
  reason: string;
  reviewNote?: string;
}

export interface PaymentActivityEntry {
  id: string;
  action: string;
  createdAt: string;
}

export interface PaymentActivityParams {
  page?: number;
  pageSize?: number;
  action?: string;
}
