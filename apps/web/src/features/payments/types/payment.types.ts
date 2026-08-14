import type { PaymentMethodType } from '@/features/payment-methods/types/payment-method.types';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface Payment {
  id: string;
  enrollmentId: string;
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
  declineReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface PaymentListParams {
  page?: number;
  pageSize?: number;
  status?: PaymentStatus;
  courseId?: string;
  search?: string;
  submittedFrom?: string;
  submittedTo?: string;
}

/** `GET /me/payments` returns a bare array - no `total` - see the load-more pattern used on the Payments page. */
export type PaymentListResult = Payment[];

export interface PaymentInstructions {
  enrollmentId: string;
  course: { id: string; title: string };
  expectedAmount: string;
  currency: string;
  paymentMethods: {
    id: string;
    name: string;
    code: string;
    type: PaymentMethodType;
    sortOrder: number;
    description?: string | null;
    instructions: {
      tagline?: string;
      tips?: string[];
      securityNotice?: string;
      transactionIdLabel?: string;
      transactionIdPlaceholder?: string;
    };
  }[];
  bank: { name: string; accountName: string; accountNumber: string; branch: string };
  instructions: string[];
  referenceInstructions: string | null;
  supportContact: string | null;
  receipt: { maximumSizeMb: number; allowedTypes: string[] };
  latestPayment: { id: string; status: PaymentStatus; attemptNumber: number } | null;
}

export interface SubmitPaymentInput {
  transactionId: string;
  submittedAmount: string;
  currency: string;
  paymentMethodId: string;
  paymentDate?: string;
  studentNote?: string;
  receipt: File;
}

export interface SubmitPaymentResult {
  id: string;
  attemptNumber: number;
  status: PaymentStatus;
  amountMismatch: boolean;
  enrollmentStatus: string;
}

export interface PaymentReceiptUrl {
  url: string;
  expiresInSeconds: number;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
}
