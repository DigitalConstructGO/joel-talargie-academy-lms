import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PromotionEngineService } from '../engine/promotion-engine.service';
import { RedemptionService } from '../services/redemption.service';

const course = {
  id: 'course-1',
  price: '100.00',
  currency: 'USD',
  categoryId: 'category-1',
  createdBy: 'instructor-1',
  status: 'PUBLISHED',
  accessType: 'PAID',
};

function ruleSet() {
  return {
    promoCode: {
      id: 'code-1',
      code: 'SAVE20',
      codeType: 'MANUAL',
      status: 'ACTIVE',
      discountType: 'PERCENTAGE',
      discountValue: '20',
      ownerUserId: null,
      affiliateId: null,
      isSingleUse: false,
      maxUsers: null,
      redemptionCount: 0,
      validFrom: null,
      validUntil: null,
    },
    courseRuleCourseIds: [],
    categoryRuleCategoryIds: [],
    userRuleUserIds: [],
    userRedemptionCountForCode: 0,
    userCountForCode: 0,
  };
}

describe('RedemptionService', () => {
  const repository = {
    findCourseForEngine: jest.fn(),
    findRuleSetByCode: jest.fn(),
    recordAffiliateClick: jest.fn(),
    findCode: jest.fn(),
    findAffiliate: jest.fn(),
    recordRedemption: jest.fn(),
    logUsage: jest.fn(),
    listMyRedemptions: jest.fn(),
  };
  const service = new RedemptionService(
    repository as never,
    new PromotionEngineService(),
  );
  const student = {
    id: 'student-1',
    email: 'student@example.com',
    roles: ['STUDENT'],
  } as never;
  const meta = { ipAddress: '1.2.3.4', userAgent: 'jest' };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findCourseForEngine.mockResolvedValue(course);
  });

  describe('validate', () => {
    it('returns a valid result without throwing (Validate Coupon)', async () => {
      repository.findRuleSetByCode.mockResolvedValue(ruleSet());
      const result = await service.validate(
        student,
        { courseId: 'course-1', code: 'SAVE20' } as never,
        meta,
      );
      expect(result.valid).toBe(true);
      expect(result.pricing.finalPrice).toBe(80);
    });

    it('returns invalid without throwing and logs COUPON_VALIDATION_FAILED', async () => {
      repository.findRuleSetByCode.mockResolvedValue(null);
      const result = await service.validate(
        student,
        { courseId: 'course-1', code: 'NOPE' } as never,
        meta,
      );
      expect(result.valid).toBe(false);
      expect(repository.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COUPON_VALIDATION_FAILED' }),
      );
    });

    it('logs COUPON_EXPIRED distinctly for an expired code (Expired Coupon)', async () => {
      repository.findRuleSetByCode.mockResolvedValue({
        ...ruleSet(),
        promoCode: {
          ...ruleSet().promoCode,
          validUntil: new Date('2020-01-01'),
        },
      });
      await service.validate(
        student,
        { courseId: 'course-1', code: 'SAVE20' } as never,
        meta,
      );
      expect(repository.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COUPON_EXPIRED' }),
      );
    });

    it('throws NotFoundException when the course does not exist', async () => {
      repository.findCourseForEngine.mockResolvedValue(undefined);
      await expect(
        service.validate(student, { courseId: 'missing' } as never, meta),
      ).rejects.toThrow(NotFoundException);
    });

    it('tracks an affiliate click when validating a code tied to an affiliate (Affiliate Tracking)', async () => {
      repository.findRuleSetByCode.mockResolvedValue({
        ...ruleSet(),
        promoCode: { ...ruleSet().promoCode, affiliateId: 'affiliate-1' },
      });
      await service.validate(
        student,
        { courseId: 'course-1', code: 'SAVE20' } as never,
        meta,
      );
      expect(repository.recordAffiliateClick).toHaveBeenCalledWith(
        'affiliate-1',
      );
    });
  });

  describe('redeem', () => {
    it('throws UnprocessableEntityException for an invalid coupon (Redeem Coupon failure path)', async () => {
      repository.findRuleSetByCode.mockResolvedValue(null);
      await expect(
        service.redeem(
          student,
          { courseId: 'course-1', code: 'NOPE' } as never,
          meta,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(repository.recordRedemption).not.toHaveBeenCalled();
    });

    it('records a redemption with correct pricing and logs COUPON_REDEEMED (Redeem Coupon)', async () => {
      repository.findRuleSetByCode.mockResolvedValue(ruleSet());
      repository.findCode.mockResolvedValue({
        id: 'code-1',
        codeType: 'MANUAL',
        ownerUserId: null,
        affiliateId: null,
      });
      repository.recordRedemption.mockResolvedValue({
        id: 'redemption-1',
        redeemedAt: new Date(),
      });
      const result = await service.redeem(
        student,
        { courseId: 'course-1', code: 'SAVE20' } as never,
        meta,
      );
      expect(repository.recordRedemption).toHaveBeenCalledWith(
        expect.objectContaining({
          codeId: 'code-1',
          studentId: 'student-1',
          originalPrice: 100,
          discountAmount: 20,
          finalPrice: 80,
          ipAddress: '1.2.3.4',
        }),
      );
      expect(repository.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COUPON_REDEEMED' }),
      );
      expect(result.redemptionId).toBe('redemption-1');
    });

    it('throws MAX_USERS_REACHED when the ledger rejects the redemption (usage cap)', async () => {
      repository.findRuleSetByCode.mockResolvedValue(ruleSet());
      repository.findCode.mockResolvedValue({
        id: 'code-1',
        affiliateId: null,
      });
      repository.recordRedemption.mockRejectedValue(
        new Error('PROMOTION_REDEMPTION_LIMIT_REACHED'),
      );
      await expect(
        service.redeem(
          student,
          { courseId: 'course-1', code: 'SAVE20' } as never,
          meta,
        ),
      ).rejects.toMatchObject({
        response: { code: 'MAX_USERS_REACHED' },
      });
    });

    it('computes affiliate commission on redemption (Affiliate Tracking)', async () => {
      repository.findRuleSetByCode.mockResolvedValue({
        ...ruleSet(),
        promoCode: { ...ruleSet().promoCode, affiliateId: 'affiliate-1' },
      });
      repository.findCode.mockResolvedValue({
        id: 'code-1',
        codeType: 'MANUAL',
        ownerUserId: null,
        affiliateId: 'affiliate-1',
      });
      repository.findAffiliate.mockResolvedValue({
        id: 'affiliate-1',
        commissionType: 'PERCENTAGE',
        commissionRate: '10',
        commissionFixedAmount: null,
      });
      repository.recordRedemption.mockResolvedValue({
        id: 'redemption-1',
        redeemedAt: new Date(),
      });
      await service.redeem(
        student,
        { courseId: 'course-1', code: 'SAVE20' } as never,
        meta,
      );
      expect(repository.recordRedemption).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: 'affiliate-1',
          affiliateCommission: 8,
        }),
      );
    });
  });

  describe('history', () => {
    it('delegates to the repository scoped to the requesting student', async () => {
      repository.listMyRedemptions.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
      await service.history('student-1', { page: 1, pageSize: 20 } as never);
      expect(repository.listMyRedemptions).toHaveBeenCalledWith('student-1', {
        page: 1,
        pageSize: 20,
      });
    });
  });
});
