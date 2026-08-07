import type { PaymentInstructions } from '@/features/payments/types/payment.types';
import type { PaymentMethodId } from '../types/checkout.types';

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

/**
 * Static per-method copy merged with the real bank/account fields from
 * `usePaymentInstructions` - the backend's `SubmitPaymentDto` has no
 * `method` field, so every method still submits the same shape (transaction
 * ID + amount + optional date/note + receipt). Only the surrounding
 * guidance and field labels change per method, instantly on selection.
 */
export function buildMethodContent(
  method: PaymentMethodId,
  instructions: PaymentInstructions,
): MethodContent {
  switch (method) {
    case 'TELEBIRR':
      return {
        tagline: 'Pay instantly using the Telebirr mobile money app.',
        fields: [
          { label: 'Merchant / recipient name', value: instructions.bank.accountName },
          { label: 'Telebirr number', value: instructions.bank.accountNumber },
        ],
        tips: [
          'Open the Telebirr app and choose "Send Money" or "Pay Merchant".',
          'Double-check the recipient name matches before confirming.',
          "Save the confirmation SMS - you'll need the transaction ID from it.",
        ],
        transactionIdLabel: 'Telebirr transaction ID',
        transactionIdPlaceholder: 'e.g. ABC1D2E3F4',
      };
    case 'CBE_BIRR':
      return {
        tagline: 'Transfer directly from your Commercial Bank of Ethiopia account.',
        fields: [
          { label: 'Account name', value: instructions.bank.accountName },
          { label: 'Account number', value: instructions.bank.accountNumber },
          ...(instructions.referenceInstructions
            ? [{ label: 'Reference', value: instructions.referenceInstructions }]
            : []),
        ],
        tips: [
          'Use the CBE Birr app or *847# USSD to transfer.',
          'Include your name as the transfer reference if possible.',
        ],
        transactionIdLabel: 'CBE reference number',
        transactionIdPlaceholder: 'e.g. FT23198456123',
      };
    case 'CHAPA':
      return {
        tagline:
          'Chapa supports card, mobile money, and bank payments through one secure checkout.',
        fields: [
          {
            label: 'Amount to pay',
            value: `${instructions.expectedAmount} ${instructions.currency}`,
          },
        ],
        tips: [
          'Normally, Chapa redirects you to a secure checkout to pay by card, Telebirr, or bank.',
          'For this academy, complete your Chapa payment first, then come back here and submit the transaction reference from your Chapa receipt.',
        ],
        securityNotice:
          'We never ask for your card number or PIN on this page - only the transaction reference from your completed Chapa payment.',
        transactionIdLabel: 'Chapa transaction reference',
        transactionIdPlaceholder: 'e.g. chapa-tx-8f3c2a91',
      };
    case 'BANK_TRANSFER':
      return {
        tagline: 'Transfer from any bank via mobile banking, internet banking, or a branch visit.',
        fields: [
          { label: 'Bank name', value: instructions.bank.name },
          { label: 'Account name', value: instructions.bank.accountName },
          { label: 'Account number', value: instructions.bank.accountNumber },
          ...(instructions.bank.branch
            ? [{ label: 'Branch', value: instructions.bank.branch }]
            : []),
        ],
        tips: [
          'Paying from outside Ethiopia? Contact academy support for a SWIFT/BIC code.',
          'Keep your bank receipt or screenshot as proof of transfer.',
        ],
        transactionIdLabel: 'Bank transfer reference',
        transactionIdPlaceholder: 'e.g. TRF20260213001',
      };
  }
}
