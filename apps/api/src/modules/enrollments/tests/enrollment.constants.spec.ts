import {
  assertValidMoneySnapshot,
  enrollmentAllowsLearningAccess,
  enrollmentNextAction,
  SEAT_RESERVING_STATUSES,
} from '../constants/enrollment.constants';

describe('enrollment policy helpers', () => {
  it.each([
    ['PENDING_PAYMENT', 'SUBMIT_PAYMENT'],
    ['WAITING_APPROVAL', 'WAIT_FOR_PAYMENT_REVIEW'],
    ['ENROLLED', 'START_COURSE'],
    ['IN_PROGRESS', 'CONTINUE_COURSE'],
    ['COMPLETED', 'VIEW_COMPLETION'],
    ['CANCELLED', 'CONTACT_SUPPORT'],
    ['ACCESS_REVOKED', 'CONTACT_SUPPORT'],
  ])('maps %s to %s', (status, expected) => {
    expect(enrollmentNextAction(status)).toBe(expected);
  });

  it('grants learning access only to learning-capable states', () => {
    expect(enrollmentAllowsLearningAccess('ENROLLED')).toBe(true);
    expect(enrollmentAllowsLearningAccess('IN_PROGRESS')).toBe(true);
    expect(enrollmentAllowsLearningAccess('COMPLETED')).toBe(true);
    expect(enrollmentAllowsLearningAccess('PENDING_PAYMENT')).toBe(false);
    expect(enrollmentAllowsLearningAccess('WAITING_APPROVAL')).toBe(false);
    expect(enrollmentAllowsLearningAccess('CANCELLED')).toBe(false);
    expect(enrollmentAllowsLearningAccess('ACCESS_REVOKED')).toBe(false);
  });

  it('counts only seat-reserving states', () => {
    expect(SEAT_RESERVING_STATUSES).toEqual([
      'PENDING_PAYMENT',
      'WAITING_APPROVAL',
      'ENROLLED',
      'IN_PROGRESS',
      'COMPLETED',
    ]);
  });

  it.each(['NaN', 'Infinity', '-1.00', '1e3', '01.00', '1.234'])(
    'rejects invalid money snapshot %s',
    (value) =>
      expect(() => assertValidMoneySnapshot(value)).toThrow(
        'INVALID_PRICE_SNAPSHOT',
      ),
  );

  it('normalizes valid snapshots without floating-point conversion', () => {
    expect(assertValidMoneySnapshot('125')).toBe('125.00');
    expect(assertValidMoneySnapshot('125.5')).toBe('125.50');
  });
});
