import type { PaymentInstructions } from '@/features/payments/types/payment.types';

export interface MethodField {
  label: string;
  value: string;
}

export interface MethodContent {
  tagline: string;
  fields: MethodField[];
  tips: string[];
  securityNotice?: string;
  transactionIdLabel: string;
  transactionIdPlaceholder: string;
}

type PaymentMethodOption = PaymentInstructions['paymentMethods'][number];

/**
 * Per-method guidance built from the DB-driven `instructions.paymentMethods`
 * entry (tagline/tips/security/field labels are edited by admins) merged with
 * the academy's bank/account fields from `usePaymentInstructions`. Only the
 * surrounding guidance and field labels change per method - the submission
 * shape is always transaction ID + amount + payment method ID + receipt.
 */
export function buildMethodContent(
  method: PaymentMethodOption,
  instructions: PaymentInstructions,
): MethodContent {
  const tagline = method.instructions.tagline || method.description || '';
  const transactionIdLabel = method.instructions.transactionIdLabel || 'Transaction ID';
  const transactionIdPlaceholder =
    method.instructions.transactionIdPlaceholder || 'Enter your transaction ID';

  const commonFields: MethodField[] =
    method.type === 'MOBILE_MONEY'
      ? [
          { label: 'Merchant / recipient name', value: instructions.bank.accountName },
          { label: 'Phone number', value: instructions.bank.accountNumber },
        ]
      : method.type === 'BANK_TRANSFER'
        ? [
            { label: 'Bank name', value: instructions.bank.name },
            { label: 'Account name', value: instructions.bank.accountName },
            { label: 'Account number', value: instructions.bank.accountNumber },
            ...(instructions.bank.branch
              ? [{ label: 'Branch', value: instructions.bank.branch }]
              : []),
            ...(instructions.referenceInstructions
              ? [{ label: 'Reference', value: instructions.referenceInstructions }]
              : []),
          ]
        : [
            {
              label: 'Amount to pay',
              value: `${instructions.expectedAmount} ${instructions.currency}`,
            },
          ];

  return {
    tagline,
    fields: commonFields,
    tips: [...(method.instructions.tips ?? []), ...instructions.instructions],
    securityNotice: method.instructions.securityNotice,
    transactionIdLabel,
    transactionIdPlaceholder,
  };
}
