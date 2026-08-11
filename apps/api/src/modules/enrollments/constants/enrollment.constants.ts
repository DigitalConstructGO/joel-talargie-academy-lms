export const SEAT_RESERVING_STATUSES = [
  'PENDING_PAYMENT',
  'WAITING_APPROVAL',
  'ENROLLED',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

export const enrollmentNextAction = (status: string) =>
  ({
    PENDING_PAYMENT: 'SUBMIT_PAYMENT',
    WAITING_APPROVAL: 'WAIT_FOR_PAYMENT_REVIEW',
    ENROLLED: 'START_COURSE',
    IN_PROGRESS: 'CONTINUE_COURSE',
    COMPLETED: 'VIEW_COMPLETION',
    CANCELLED: 'CONTACT_SUPPORT',
    ACCESS_REVOKED: 'CONTACT_SUPPORT',
  })[status] ?? 'NONE';

export const enrollmentAllowsLearningAccess = (status: string) =>
  status === 'ENROLLED' || status === 'IN_PROGRESS' || status === 'COMPLETED';

const MONEY_PATTERN = /^(0|[1-9]\d{0,9})(\.\d{1,2})?$/;

export const assertValidMoneySnapshot = (value: string) => {
  if (!MONEY_PATTERN.test(value)) throw new Error('INVALID_PRICE_SNAPSHOT');
  const [whole, fraction = ''] = value.split('.');
  return `${whole}.${fraction.padEnd(2, '0')}`;
};
