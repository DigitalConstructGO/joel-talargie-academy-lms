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

const activeCampaign = {
  id: 'campaign-1',
  name: 'Save 20',
  type: 'MANUAL_COUPON',
  status: 'ACTIVE',
  discountType: 'PERCENTAGE',
  discountValue: '20',
  maxDiscountAmount: null,
  minimumPurchaseAmount: null,
  isAutomatic: false,
  priority: 0,
  startsAt: new Date('2020-01-01T00:00:00Z'),
  endsAt: null,
  maxRedemptions: null,
  maxRedemptionsPerUser: 1,
  redemptionCount: 0,
  allowedRoles: null,
  allowedCountries: null,
  allowedEmailDomains: null,
  allowedPaymentMethods: null,
  allowedDaysOfWeek: null,
  allowedHourStart: null,
  allowedHourEnd: null,
  newStudentsOnly: false,
  restrictToInstructorId: null,
  requiresApproval: false,
  totalSeats: null,
  seatsUsed: 0,
  archivedAt: null,
  referrerRewardType: null,
  referrerRewardValue: null,
};

function manualRuleSet() {
  return {
    campaign: activeCampaign,
    promoCode: {
      id: 'code-1',
      campaignId: 'campaign-1',
      code: 'SAVE20',
      codeType: 'MANUAL',
      status: 'ACTIVE',
      ownerUserId: null,
      affiliateId: null,
      isSingleUse: false,
      maxRedemptions: null,
      maxRedemptionsPerUser: null,
      redemptionCount: 0,
      validFrom: null,
      validUntil: null,
    },
    courseRuleCourseIds: [],
    categoryRuleCategoryIds: [],
    userRuleUserIds: [],
    userRedemptionCountForCode: 0,
    userRedemptionCountForCampaign: 0,
  };
}

describe('RedemptionService', () => {
  const repository = {
    findCourseForEngine: jest.fn(),
    findRuleSetByCode: jest.fn(),
    findAutomaticCandidates: jest.fn(),
    isNewStudent: jest.fn(),
    recordAffiliateClick: jest.fn(),
    findCode: jest.fn(),
    findCampaign: jest.fn(),
    findAffiliate: jest.fn(),
    recordRedemption: jest.fn(),
    logUsage: jest.fn(),
    listMyRedemptions: jest.fn(),
    findActiveReferralCampaign: jest.fn(),
    findOrCreateReferralCode: jest.fn(),
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
    repository.isNewStudent.mockResolvedValue(false);
    repository.findAutomaticCandidates.mockResolvedValue([]);
  });

  describe('validate', () => {
    it('returns a valid result without throwing (Validate Coupon)', async () => {
      repository.findRuleSetByCode.mockResolvedValue(manualRuleSet());
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

    it('logs COUPON_EXPIRED distinctly for an expired campaign (Expired Coupon)', async () => {
      repository.findRuleSetByCode.mockResolvedValue({
        ...manualRuleSet(),
        campaign: { ...activeCampaign, endsAt: new Date('2020-01-01') },
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
        ...manualRuleSet(),
        promoCode: { ...manualRuleSet().promoCode, affiliateId: 'affiliate-1' },
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
      repository.findRuleSetByCode.mockResolvedValue(manualRuleSet());
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
          campaignId: 'campaign-1',
          codeId: 'code-1',
          studentId: 'student-1',
          status: 'CONFIRMED',
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
      expect(result.pendingApproval).toBe(false);
    });

    it('reserves (does not confirm) a redemption for a requiresApproval scholarship campaign', async () => {
      repository.findRuleSetByCode.mockResolvedValue({
        ...manualRuleSet(),
        campaign: { ...activeCampaign, requiresApproval: true },
      });
      repository.findCampaign.mockResolvedValue({
        ...activeCampaign,
        requiresApproval: true,
      });
      repository.findCode.mockResolvedValue({
        id: 'code-1',
        codeType: 'MANUAL',
        ownerUserId: null,
        affiliateId: null,
      });
      repository.recordRedemption.mockResolvedValue({
        id: 'redemption-1',
        status: 'RESERVED',
        redeemedAt: new Date(),
      });
      const result = await service.redeem(
        student,
        { courseId: 'course-1', code: 'SAVE20' } as never,
        meta,
      );
      expect(repository.recordRedemption).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'RESERVED' }),
      );
      expect(result.pendingApproval).toBe(true);
      expect(result.redemptionStatus).toBe('RESERVED');
    });

    it('credits the referral owner with a computed reward when a referral code is redeemed by someone else (Referral Tracking)', async () => {
      repository.findRuleSetByCode.mockResolvedValue({
        ...manualRuleSet(),
        campaign: {
          ...activeCampaign,
          referrerRewardType: 'PERCENTAGE',
          referrerRewardValue: '10',
        },
        promoCode: {
          ...manualRuleSet().promoCode,
          codeType: 'REFERRAL',
          ownerUserId: 'referrer-1',
        },
      });
      repository.findCode.mockResolvedValue({
        id: 'code-1',
        codeType: 'REFERRAL',
        ownerUserId: 'referrer-1',
        affiliateId: null,
      });
      repository.findCampaign.mockResolvedValue({
        ...activeCampaign,
        referrerRewardType: 'PERCENTAGE',
        referrerRewardValue: '10',
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
          referralOwnerId: 'referrer-1',
          referrerRewardAmount: 8,
        }),
      );
    });

    it('does not self-credit a referral when the redeemer owns the code', async () => {
      repository.findRuleSetByCode.mockResolvedValue({
        ...manualRuleSet(),
        promoCode: {
          ...manualRuleSet().promoCode,
          codeType: 'REFERRAL',
          ownerUserId: 'student-1',
        },
      });
      repository.findCode.mockResolvedValue({
        id: 'code-1',
        codeType: 'REFERRAL',
        ownerUserId: 'student-1',
        affiliateId: null,
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
        expect.objectContaining({ referralOwnerId: null }),
      );
    });

    it('computes affiliate commission on redemption (Affiliate Tracking)', async () => {
      repository.findRuleSetByCode.mockResolvedValue({
        ...manualRuleSet(),
        promoCode: { ...manualRuleSet().promoCode, affiliateId: 'affiliate-1' },
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

  describe('myReferralCode', () => {
    it('throws NotFoundException when no active referral program exists', async () => {
      repository.findActiveReferralCampaign.mockResolvedValue(undefined);
      await expect(service.myReferralCode('student-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the existing referral code without creating a new one', async () => {
      repository.findActiveReferralCampaign.mockResolvedValue({
        id: 'ref-campaign',
        name: 'Referrals',
      });
      repository.findOrCreateReferralCode.mockResolvedValue({
        code: 'REFABCD',
        created: false,
      });
      const result = await service.myReferralCode('student-1');
      expect(result.code).toBe('REFABCD');
      expect(repository.logUsage).not.toHaveBeenCalled();
    });

    it('logs COUPON_GENERATED when a new referral code is minted', async () => {
      repository.findActiveReferralCampaign.mockResolvedValue({
        id: 'ref-campaign',
        name: 'Referrals',
      });
      repository.findOrCreateReferralCode.mockResolvedValue({
        code: 'REFNEW1',
        created: true,
      });
      await service.myReferralCode('student-1');
      expect(repository.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COUPON_GENERATED' }),
      );
    });
  });
});
