export const CHECKOUT_STEPS = [
  { id: 1, label: 'Course Summary' },
  { id: 2, label: 'Promo Code' },
  { id: 3, label: 'Payment Method' },
] as const;

export type CheckoutStepId = (typeof CHECKOUT_STEPS)[number]['id'];

/**
 * Payment-receipt review data: the just-submitted form fields, kept client-side
 * since `SubmitPaymentResult` doesn't echo them back.
 */
export interface SubmittedPaymentSummary {
  transactionId: string;
  submittedAmount: string;
  currency: string;
  paymentDate?: string;
  methodName: string;
  receiptFileName: string;
}
