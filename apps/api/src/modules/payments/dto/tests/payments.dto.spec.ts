import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ApprovePaymentDto,
  DeclinePaymentDto,
  PaymentActivityQueryDto,
  PaymentListQueryDto,
  PaymentStatus,
  SubmitPaymentDto,
} from '../payments.dto';

describe('payments DTOs', () => {
  describe('SubmitPaymentDto', () => {
    const valid = {
      transactionId: 'TXN-12345',
      submittedAmount: '99.99',
      currency: 'etb',
    };

    it('trims the transaction id and uppercases the currency', () => {
      const instance = plainToInstance(SubmitPaymentDto, {
        ...valid,
        transactionId: '  TXN-12345  ',
      });
      expect(instance.transactionId).toBe('TXN-12345');
      expect(instance.currency).toBe('ETB');
    });

    it('accepts a minimal valid payload', async () => {
      const errors = await validate(plainToInstance(SubmitPaymentDto, valid));
      expect(errors).toHaveLength(0);
    });

    it('rejects a transactionId with disallowed characters', async () => {
      const errors = await validate(
        plainToInstance(SubmitPaymentDto, {
          ...valid,
          transactionId: '<script>alert(1)</script>',
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a malformed submittedAmount', async () => {
      const errors = await validate(
        plainToInstance(SubmitPaymentDto, { ...valid, submittedAmount: '-5' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a currency that is not a 3-letter code', async () => {
      const errors = await validate(
        plainToInstance(SubmitPaymentDto, { ...valid, currency: 'US' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts optional paymentDate and studentNote', async () => {
      const errors = await validate(
        plainToInstance(SubmitPaymentDto, {
          ...valid,
          paymentDate: '2026-08-01T00:00:00.000Z',
          studentNote: 'Paid via bank transfer',
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('PaymentListQueryDto', () => {
    it('applies page/pageSize defaults', () => {
      const instance = plainToInstance(PaymentListQueryDto, {});
      expect(instance.page).toBe(1);
      expect(instance.pageSize).toBe(20);
    });

    it('accepts a full valid query and coerces boolean flags', async () => {
      const instance = plainToInstance(PaymentListQueryDto, {
        status: PaymentStatus.PENDING,
        courseId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
        search: 'ada',
        submittedFrom: '2026-01-01T00:00:00.000Z',
        submittedTo: '2026-08-01T00:00:00.000Z',
        amountMismatch: 'true',
        duplicateOnly: 'true',
      });
      expect(instance.amountMismatch).toBe(true);
      expect(instance.duplicateOnly).toBe(true);
      expect(await validate(instance)).toHaveLength(0);
    });

    it('rejects a non-UUID courseId', async () => {
      const errors = await validate(
        plainToInstance(PaymentListQueryDto, { courseId: 'not-a-uuid' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ApprovePaymentDto', () => {
    it('accepts an empty payload', async () => {
      expect(
        await validate(plainToInstance(ApprovePaymentDto, {})),
      ).toHaveLength(0);
    });

    it('rejects a mismatchApprovalReason below the minimum length', async () => {
      const errors = await validate(
        plainToInstance(ApprovePaymentDto, { mismatchApprovalReason: 'ab' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('DeclinePaymentDto', () => {
    it('requires a reason', async () => {
      const errors = await validate(plainToInstance(DeclinePaymentDto, {}));
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a valid reason', async () => {
      const errors = await validate(
        plainToInstance(DeclinePaymentDto, { reason: 'Amount mismatch' }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  it('PaymentActivityQueryDto applies defaults and accepts an action filter', async () => {
    const instance = plainToInstance(PaymentActivityQueryDto, {
      action: 'payment.approved',
    });
    expect(instance.page).toBe(1);
    expect(await validate(instance)).toHaveLength(0);
  });
});
