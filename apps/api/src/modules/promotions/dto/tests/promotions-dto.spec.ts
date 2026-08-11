import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  ListCampaignsDto,
} from '../campaign.dto';
import {
  CreateCouponDto,
  GenerateCouponsDto,
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
  describe('CreateCampaignDto', () => {
    const valid = {
      name: 'Summer Sale',
      type: 'PERCENTAGE_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    };

    it('accepts a minimal valid payload', async () => {
      const errors = await validate(plainToInstance(CreateCampaignDto, valid));
      expect(errors).toHaveLength(0);
    });

    it('rejects a name shorter than the minimum length', async () => {
      const errors = await validate(
        plainToInstance(CreateCampaignDto, { ...valid, name: 'ab' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects an unrecognized campaign type', async () => {
      const errors = await validate(
        plainToInstance(CreateCampaignDto, { ...valid, type: 'NOT_A_TYPE' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a discountValue outside its allowed range', async () => {
      const errors = await validate(
        plainToInstance(CreateCampaignDto, { ...valid, discountValue: -5 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a malformed startsAt date', async () => {
      const errors = await validate(
        plainToInstance(CreateCampaignDto, {
          ...valid,
          startsAt: 'not-a-date',
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a courseIds entry that is not a UUID', async () => {
      const errors = await validate(
        plainToInstance(CreateCampaignDto, {
          ...valid,
          courseIds: ['not-a-uuid'],
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects an allowedRoles entry outside STUDENT/ADMINISTRATOR', async () => {
      const errors = await validate(
        plainToInstance(CreateCampaignDto, {
          ...valid,
          allowedRoles: ['SUPERUSER'],
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a fully populated payload', async () => {
      const errors = await validate(
        plainToInstance(CreateCampaignDto, {
          ...valid,
          description: 'A big summer sale',
          status: 'ACTIVE',
          maxDiscountAmount: 50,
          minimumPurchaseAmount: 10,
          isAutomatic: true,
          priority: 5,
          startsAt: '2026-06-01T00:00:00.000Z',
          endsAt: '2026-08-01T00:00:00.000Z',
          maxRedemptions: 1000,
          maxRedemptionsPerUser: 1,
          allowedRoles: ['STUDENT'],
          allowedCountries: ['ET'],
          allowedEmailDomains: ['example.com'],
          allowedPaymentMethods: ['BANK_TRANSFER'],
          allowedDaysOfWeek: [1, 2, 3],
          allowedHourStart: 8,
          allowedHourEnd: 20,
          newStudentsOnly: true,
          restrictToInstructorId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          requiresApproval: false,
          totalSeats: 100,
          sponsorName: 'Sponsor Inc',
          sponsorNotes: 'notes',
          referrerRewardType: 'FIXED',
          referrerRewardValue: 5,
          affiliateId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          metadata: { source: 'campaign' },
          courseIds: ['3cf4bc56-c5ed-4e46-8558-822bcde19501'],
          categoryIds: ['3cf4bc56-c5ed-4e46-8558-822bcde19501'],
          userIds: ['3cf4bc56-c5ed-4e46-8558-822bcde19501'],
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateCampaignDto', () => {
    it('accepts an empty payload (every field optional)', async () => {
      const errors = await validate(plainToInstance(UpdateCampaignDto, {}));
      expect(errors).toHaveLength(0);
    });

    it('rejects an out-of-range discountValue', async () => {
      const errors = await validate(
        plainToInstance(UpdateCampaignDto, { discountValue: 2_000_000 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ListCampaignsDto', () => {
    it('accepts an empty query', async () => {
      const errors = await validate(plainToInstance(ListCampaignsDto, {}));
      expect(errors).toHaveLength(0);
    });

    it('rejects an unrecognized status filter', async () => {
      const errors = await validate(
        plainToInstance(ListCampaignsDto, { status: 'NOT_A_STATUS' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateCouponDto', () => {
    it('accepts a minimal valid payload', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, {
          campaignId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
        }),
      );
      expect(errors).toHaveLength(0);
    });

    it('rejects a manual code containing invalid characters', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, {
          campaignId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          code: 'not a valid code!!',
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a non-UUID campaignId', async () => {
      const errors = await validate(
        plainToInstance(CreateCouponDto, { campaignId: 'not-a-uuid' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('GenerateCouponsDto', () => {
    it('accepts a minimal valid payload', async () => {
      const errors = await validate(
        plainToInstance(GenerateCouponsDto, {
          campaignId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          count: 10,
        }),
      );
      expect(errors).toHaveLength(0);
    });

    it('rejects a count above the bulk-generate limit', async () => {
      const errors = await validate(
        plainToInstance(GenerateCouponsDto, {
          campaignId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          count: 100000,
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a prefix with invalid characters', async () => {
      const errors = await validate(
        plainToInstance(GenerateCouponsDto, {
          campaignId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          count: 10,
          prefix: '!!invalid!!',
        }),
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
