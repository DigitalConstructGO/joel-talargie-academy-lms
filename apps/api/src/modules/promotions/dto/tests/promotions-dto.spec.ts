import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ListCouponsDto,
} from '../coupon.dto';
import {
  CreateAffiliateDto,
  UpdateAffiliateDto,
  ListAffiliatesDto,
} from '../affiliate.dto';
import { AnalyticsQueryDto } from '../analytics.dto';

describe('promotions DTOs', () => {
  describe('CreateCouponDto', () => {
    it('accepts a minimal valid payload', async () => {
      const errors = await validate(plainToInstance(CreateCouponDto, {}));
      expect(errors).toHaveLength(0);
    });

    it('accepts a fully populated payload', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, {
          code: 'SAVE20',
          codeType: 'MANUAL',
          status: 'ACTIVE',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          ownerUserId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          affiliateId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          isSingleUse: false,
          maxUsers: 50,
          validFrom: '2026-06-01T00:00:00.000Z',
          validUntil: '2026-08-01T00:00:00.000Z',
          courseIds: ['3cf4bc56-c5ed-4e46-8558-822bcde19501'],
          categoryIds: ['3cf4bc56-c5ed-4e46-8558-822bcde19501'],
          userIds: ['3cf4bc56-c5ed-4e46-8558-822bcde19501'],
        }),
      );
      expect(errors).toHaveLength(0);
    });

    it('rejects a non-positive maxUsers', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, { maxUsers: 0 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a manual code containing invalid characters', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, { code: 'not a valid code!!' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects an unrecognized discount type', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, { discountType: 'NOT_A_TYPE' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a negative discountValue', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, { discountValue: -5 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a non-UUID targeting rule entry', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, { courseIds: ['not-a-uuid'] }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateCouponDto', () => {
    it('accepts an empty payload', async () => {
      const errors = await validate(plainToInstance(UpdateCouponDto, {}));
      expect(errors).toHaveLength(0);
    });

    it('rejects an unrecognized status', async () => {
      const errors = await validate(
        plainToInstance(UpdateCouponDto, { status: 'NOT_A_STATUS' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a nullable maxUsers override', async () => {
      const errors = await validate(
        plainToInstance(UpdateCouponDto, {
          maxUsers: null,
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('ListCouponsDto', () => {
    it('accepts an empty query', async () => {
      const errors = await validate(plainToInstance(ListCouponsDto, {}));
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateAffiliateDto', () => {
    it('accepts a minimal valid payload', async () => {
      const errors = await validate(
        plainToInstance(CreateAffiliateDto, {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
        }),
      );
      expect(errors).toHaveLength(0);
    });

    it('rejects an invalid email', async () => {
      const errors = await validate(
        plainToInstance(CreateAffiliateDto, {
          name: 'Ada Lovelace',
          email: 'not-an-email',
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a commissionRate above 100', async () => {
      const errors = await validate(
        plainToInstance(CreateAffiliateDto, {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          commissionRate: 150,
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateAffiliateDto', () => {
    it('accepts an empty payload', async () => {
      const errors = await validate(plainToInstance(UpdateAffiliateDto, {}));
      expect(errors).toHaveLength(0);
    });
  });

  describe('ListAffiliatesDto', () => {
    it('accepts an empty query', async () => {
      const errors = await validate(plainToInstance(ListAffiliatesDto, {}));
      expect(errors).toHaveLength(0);
    });
  });

  describe('AnalyticsQueryDto', () => {
    it('coerces a string limit to a number within range', async () => {
      const instance = plainToInstance(AnalyticsQueryDto, { limit: '10' });
      expect(instance.limit).toBe(10);
      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('rejects a limit above the maximum', async () => {
      const errors = await validate(
        plainToInstance(AnalyticsQueryDto, { limit: 100 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
