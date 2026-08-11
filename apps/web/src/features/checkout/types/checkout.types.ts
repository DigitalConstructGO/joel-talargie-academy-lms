export const CHECKOUT_STEPS = [
  { id: 1, label: 'Course Summary' },
  { id: 2, label: 'Promo Code' },
  { id: 3, label: 'Payment Method' },
  { id: 4, label: 'Payment Receipt' },
  { id: 5, label: 'Confirmation' },
] as const;

export type CheckoutStepId = (typeof CHECKOUT_STEPS)[number]['id'];

export type PaymentMethodId = 'TELEBIRR' | 'CBE_BIRR' | 'CHAPA' | 'BANK_TRANSFER';

export const PAYMENT_METHODS: { id: PaymentMethodId; label: string }[] = [
  { id: 'TELEBIRR', label: 'Telebirr' },
  { id: 'CBE_BIRR', label: 'CBE Birr' },
  { id: 'CHAPA', label: 'Chapa' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

/** Payment-receipt review data: the just-submitted form fields, kept client-side since `SubmitPaymentResult` doesn't echo them back. */
export interface SubmittedPaymentSummary {
  transactionId: string;
  submittedAmount: string;
  currency: string;
  paymentDate?: string;
  methodLabel: string;
  receiptFileName: string;
}
