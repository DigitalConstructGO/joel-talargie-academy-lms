import { extractErrorCode, extractErrorMessage } from '@/lib/api/api-error';

const APPROVE_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_ALREADY_REVIEWED: 'This payment was already reviewed.',
  PAYMENT_AMOUNT_MISMATCH:
    "You don't have permission to approve a payment with a mismatched amount. Ask an admin with the enhanced mismatch-approval permission.",
  MISMATCH_APPROVAL_REASON_REQUIRED: 'Enter a reason for approving the mismatched amount first.',
  PAYMENT_DUPLICATE_TRANSACTION_REVIEW_REQUIRED:
    'Confirm the duplicate-transaction warning before approving.',
};

const DECLINE_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_ALREADY_REVIEWED: 'This payment was already reviewed.',
};

export function approveErrorMessage(error: unknown): string {
  const code = extractErrorCode(error);
  if (code && APPROVE_ERROR_MESSAGES[code]) return APPROVE_ERROR_MESSAGES[code];
  return extractErrorMessage(error, 'Could not approve this payment. Please try again.');
}

export function declineErrorMessage(error: unknown): string {
  const code = extractErrorCode(error);
  if (code && DECLINE_ERROR_MESSAGES[code]) return DECLINE_ERROR_MESSAGES[code];
  return extractErrorMessage(error, 'Could not decline this payment. Please try again.');
}
