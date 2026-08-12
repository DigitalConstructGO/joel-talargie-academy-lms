import { Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  schema,
  sql,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type {
  EngineCourse,
  EngineRuleSet,
} from '../interfaces/promotion.interface';
import type {
  CreateCampaignDto,
  ListCampaignsDto,
  UpdateCampaignDto,
} from '../dto/campaign.dto';
import type {
  CreateCouponDto,
  ListCouponsDto,
  UpdateCouponDto,
} from '../dto/coupon.dto';
import type { ListAffiliatesDto } from '../dto/affiliate.dto';
import type { ListRedemptionsDto } from '../dto/redemption.dto';

const ACTIVE_REDEMPTION_STATUSES = ['RESERVED', 'CONFIRMED'] as const;

@Injectable()
export class PromotionsRepository {
  constructor(private readonly database: DatabaseService) {}
  private get db() {
    return this.database.client;
  }

  // ---------------------------------------------------------------------
  // Engine data fetching (read-only, feeds the pure PromotionEngineService)
  // ---------------------------------------------------------------------

  async findCourseForEngine(
    courseId: string,
  ): Promise<EngineCourse | undefined> {
    const [row] = await this.db
      .select({
        id: schema.courses.id,
        price: schema.courses.price,
        currency: schema.courses.currency,
        categoryId: schema.courses.categoryId,
        createdBy: schema.courses.createdBy,
        status: schema.courses.status,
        accessType: schema.courses.accessType,
      })
      .from(schema.courses)
      .where(
        and(eq(schema.courses.id, courseId), isNull(schema.courses.archivedAt)),
      )
      .limit(1);
    return row;
  }

  async isNewStudent(userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ value: count() })
      .from(schema.enrollments)
      .where(eq(schema.enrollments.studentId, userId));
    return (row?.value ?? 0) === 0;
  }

  async findRuleSetByCode(
    normalizedCode: string,
    userId: string,
  ): Promise<EngineRuleSet | null> {
    const [row] = await this.db
      .select({ code: schema.promoCodes, campaign: schema.promoCampaigns })
      .from(schema.promoCodes)
      .innerJoin(
        schema.promoCampaigns,
        eq(schema.promoCampaigns.id, schema.promoCodes.campaignId),
      )
      .where(eq(schema.promoCodes.code, normalizedCode))
      .limit(1);
    if (!row) return null;
    return this.buildRuleSet(row.campaign, row.code, userId);
  }

  /**
   * Batch-fetches automatic campaigns for a course/user pricing check.
   * Rule rows and redemption counts are fetched once each across every
   * candidate campaign (`inArray` + `groupBy`) instead of per-campaign, so
   * this stays at a fixed 5 round trips regardless of how many automatic
   * campaigns are active - avoids an N+1 that used to scale linearly with
   * campaign count on this checkout/pricing hot path.
   */
  async findAutomaticCandidates(
    courseId: string,
    userId: string,
  ): Promise<EngineRuleSet[]> {
    const campaigns = await this.db
      .select()
      .from(schema.promoCampaigns)
      .where(
        and(
          eq(schema.promoCampaigns.isAutomatic, true),
          eq(schema.promoCampaigns.status, 'ACTIVE'),
          isNull(schema.promoCampaigns.archivedAt),
        ),
      );
    void courseId;
    if (!campaigns.length) return [];
    const campaignIds = campaigns.map((campaign) => campaign.id);
    const [courseRules, categoryRules, userRules, redemptionCounts] =
      await Promise.all([
        this.db
          .select({
            campaignId: schema.promoCourseRules.campaignId,
            courseId: schema.promoCourseRules.courseId,
          })
          .from(schema.promoCourseRules)
          .where(inArray(schema.promoCourseRules.campaignId, campaignIds)),
        this.db
          .select({
            campaignId: schema.promoCategoryRules.campaignId,
            categoryId: schema.promoCategoryRules.categoryId,
          })
          .from(schema.promoCategoryRules)
          .where(inArray(schema.promoCategoryRules.campaignId, campaignIds)),
        this.db
          .select({
            campaignId: schema.promoUserRules.campaignId,
            userId: schema.promoUserRules.userId,
          })
          .from(schema.promoUserRules)
          .where(inArray(schema.promoUserRules.campaignId, campaignIds)),
        this.db
          .select({
            campaignId: schema.promoRedemptions.campaignId,
            value: count(),
          })
          .from(schema.promoRedemptions)
          .where(
            and(
              eq(schema.promoRedemptions.studentId, userId),
              inArray(schema.promoRedemptions.campaignId, campaignIds),
              inArray(
                schema.promoRedemptions.status,
                ACTIVE_REDEMPTION_STATUSES,
              ),
            ),
          )
          .groupBy(schema.promoRedemptions.campaignId),
      ]);
    const byCampaign = <T, V>(rows: T[], value: (row: T) => V) => {
      const map = new Map<string, V[]>();
      for (const row of rows) {
        const campaignId = (row as { campaignId: string }).campaignId;
        const list = map.get(campaignId);
        if (list) list.push(value(row));
        else map.set(campaignId, [value(row)]);
      }
      return map;
    };
    const courseRuleMap = byCampaign(courseRules, (r) => r.courseId);
    const categoryRuleMap = byCampaign(categoryRules, (r) => r.categoryId);
    const userRuleMap = byCampaign(userRules, (r) => r.userId);
    const redemptionMap = new Map(
      redemptionCounts.map((row) => [row.campaignId, row.value]),
    );
    return campaigns.map((campaign) =>
      this.presentRuleSet(
        campaign,
        null,
        courseRuleMap.get(campaign.id) ?? [],
        categoryRuleMap.get(campaign.id) ?? [],
        userRuleMap.get(campaign.id) ?? [],
        { forCampaign: redemptionMap.get(campaign.id) ?? 0, forCode: 0 },
      ),
    );
  }

  private async buildRuleSet(
    campaign: typeof schema.promoCampaigns.$inferSelect,
    code: typeof schema.promoCodes.$inferSelect | null,
    userId: string,
  ): Promise<EngineRuleSet> {
    const [courseRuleIds, categoryRuleIds, userRuleIds, redemptionCounts] =
      await Promise.all([
        this.db
          .select({ courseId: schema.promoCourseRules.courseId })
          .from(schema.promoCourseRules)
          .where(eq(schema.promoCourseRules.campaignId, campaign.id)),
        this.db
          .select({ categoryId: schema.promoCategoryRules.categoryId })
          .from(schema.promoCategoryRules)
          .where(eq(schema.promoCategoryRules.campaignId, campaign.id)),
        this.db
          .select({ userId: schema.promoUserRules.userId })
          .from(schema.promoUserRules)
          .where(eq(schema.promoUserRules.campaignId, campaign.id)),
        this.redemptionCountsFor(userId, campaign.id, code?.id ?? null),
      ]);
    return this.presentRuleSet(
      campaign,
      code,
      courseRuleIds.map((r) => r.courseId),
      categoryRuleIds.map((r) => r.categoryId),
      userRuleIds.map((r) => r.userId),
      redemptionCounts,
    );
  }

  private presentRuleSet(
    campaign: typeof schema.promoCampaigns.$inferSelect,
    code: typeof schema.promoCodes.$inferSelect | null,
    courseRuleCourseIds: string[],
    categoryRuleCategoryIds: string[],
    userRuleUserIds: string[],
    redemptionCounts: { forCode: number; forCampaign: number },
  ): EngineRuleSet {
    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        discountType: campaign.discountType,
        discountValue: campaign.discountValue,
        maxDiscountAmount: campaign.maxDiscountAmount,
        minimumPurchaseAmount: campaign.minimumPurchaseAmount,
        isAutomatic: campaign.isAutomatic,
        priority: campaign.priority,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
        maxRedemptions: campaign.maxRedemptions,
        maxRedemptionsPerUser: campaign.maxRedemptionsPerUser,
        redemptionCount: campaign.redemptionCount,
        allowedRoles: campaign.allowedRoles,
        allowedCountries: campaign.allowedCountries,
        allowedEmailDomains: campaign.allowedEmailDomains,
        allowedPaymentMethods: campaign.allowedPaymentMethods,
        allowedDaysOfWeek: campaign.allowedDaysOfWeek,
        allowedHourStart: campaign.allowedHourStart,
        allowedHourEnd: campaign.allowedHourEnd,
        newStudentsOnly: campaign.newStudentsOnly,
        restrictToInstructorId: campaign.restrictToInstructorId,
        requiresApproval: campaign.requiresApproval,
        totalSeats: campaign.totalSeats,
        seatsUsed: campaign.seatsUsed,
        archivedAt: campaign.archivedAt,
      },
      promoCode: code
        ? {
            id: code.id,
            campaignId: code.campaignId,
            code: code.code,
            codeType: code.codeType,
            status: code.status,
            ownerUserId: code.ownerUserId,
            affiliateId: code.affiliateId,
            isSingleUse: code.isSingleUse,
            maxRedemptions: code.maxRedemptions,
            maxRedemptionsPerUser: code.maxRedemptionsPerUser,
            redemptionCount: code.redemptionCount,
            validFrom: code.validFrom,
            validUntil: code.validUntil,
          }
        : null,
      courseRuleCourseIds,
      categoryRuleCategoryIds,
      userRuleUserIds,
      userRedemptionCountForCode: redemptionCounts.forCode,
      userRedemptionCountForCampaign: redemptionCounts.forCampaign,
    };
  }

  private async redemptionCountsFor(
    userId: string,
    campaignId: string,
    codeId: string | null,
  ): Promise<{ forCode: number; forCampaign: number }> {
    const [forCampaignRow] = await this.db
      .select({ value: count() })
      .from(schema.promoRedemptions)
      .where(
        and(
          eq(schema.promoRedemptions.studentId, userId),
          eq(schema.promoRedemptions.campaignId, campaignId),
          inArray(schema.promoRedemptions.status, ACTIVE_REDEMPTION_STATUSES),
        ),
      );
    let forCode = 0;
    if (codeId) {
      const [forCodeRow] = await this.db
        .select({ value: count() })
        .from(schema.promoRedemptions)
        .where(
          and(
            eq(schema.promoRedemptions.studentId, userId),
            eq(schema.promoRedemptions.codeId, codeId),
            inArray(schema.promoRedemptions.status, ACTIVE_REDEMPTION_STATUSES),
          ),
        );
      forCode = forCodeRow?.value ?? 0;
    }
    return { forCampaign: forCampaignRow?.value ?? 0, forCode };
  }

  // ---------------------------------------------------------------------
  // Campaigns
  // ---------------------------------------------------------------------

  async createCampaign(actorId: string, dto: CreateCampaignDto) {
    const [row] = await this.db
      .insert(schema.promoCampaigns)
      .values({
        name: dto.name,
        description: dto.description,
        type: dto.type,
        status: dto.status ?? 'DRAFT',
        discountType: dto.discountType,
        discountValue: dto.discountValue.toString(),
        maxDiscountAmount: dto.maxDiscountAmount?.toString(),
        minimumPurchaseAmount: dto.minimumPurchaseAmount?.toString(),
        isAutomatic: dto.isAutomatic ?? false,
        priority: dto.priority ?? 0,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        maxRedemptions: dto.maxRedemptions,
        maxRedemptionsPerUser: dto.maxRedemptionsPerUser ?? 1,
        allowedRoles: dto.allowedRoles,
        allowedCountries: dto.allowedCountries,
        allowedEmailDomains: dto.allowedEmailDomains,
        allowedPaymentMethods: dto.allowedPaymentMethods,
        allowedDaysOfWeek: dto.allowedDaysOfWeek,
        allowedHourStart: dto.allowedHourStart,
        allowedHourEnd: dto.allowedHourEnd,
        newStudentsOnly: dto.newStudentsOnly ?? false,
        restrictToInstructorId: dto.restrictToInstructorId,
        requiresApproval: dto.requiresApproval ?? false,
        totalSeats: dto.totalSeats,
        sponsorName: dto.sponsorName,
        sponsorNotes: dto.sponsorNotes,
        referrerRewardType: dto.referrerRewardType,
        referrerRewardValue: dto.referrerRewardValue?.toString(),
        affiliateId: dto.affiliateId,
        metadata: dto.metadata ?? {},
        createdBy: actorId,
      })
      .returning();
    if (dto.courseIds?.length) await this.setCourseRules(row.id, dto.courseIds);
    if (dto.categoryIds?.length)
      await this.setCategoryRules(row.id, dto.categoryIds);
    if (dto.userIds?.length) await this.setUserRules(row.id, dto.userIds);
    return row;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    const values: Partial<typeof schema.promoCampaigns.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (dto.name !== undefined) values.name = dto.name;
    if (dto.description !== undefined) values.description = dto.description;
    if (dto.status !== undefined) values.status = dto.status;
    if (dto.discountType !== undefined) values.discountType = dto.discountType;
    if (dto.discountValue !== undefined)
      values.discountValue = dto.discountValue.toString();
    if (dto.maxDiscountAmount !== undefined)
      values.maxDiscountAmount = dto.maxDiscountAmount?.toString() ?? null;
    if (dto.minimumPurchaseAmount !== undefined)
      values.minimumPurchaseAmount =
        dto.minimumPurchaseAmount?.toString() ?? null;
    if (dto.isAutomatic !== undefined) values.isAutomatic = dto.isAutomatic;
    if (dto.priority !== undefined) values.priority = dto.priority;
    if (dto.startsAt !== undefined) values.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined)
      values.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.maxRedemptions !== undefined)
      values.maxRedemptions = dto.maxRedemptions;
    if (dto.maxRedemptionsPerUser !== undefined)
      values.maxRedemptionsPerUser = dto.maxRedemptionsPerUser;
    if (dto.allowedRoles !== undefined) values.allowedRoles = dto.allowedRoles;
    if (dto.allowedCountries !== undefined)
      values.allowedCountries = dto.allowedCountries;
    if (dto.allowedEmailDomains !== undefined)
      values.allowedEmailDomains = dto.allowedEmailDomains;
    if (dto.allowedPaymentMethods !== undefined)
      values.allowedPaymentMethods = dto.allowedPaymentMethods;
    if (dto.allowedDaysOfWeek !== undefined)
      values.allowedDaysOfWeek = dto.allowedDaysOfWeek;
    if (dto.allowedHourStart !== undefined)
      values.allowedHourStart = dto.allowedHourStart;
    if (dto.allowedHourEnd !== undefined)
      values.allowedHourEnd = dto.allowedHourEnd;
    if (dto.newStudentsOnly !== undefined)
      values.newStudentsOnly = dto.newStudentsOnly;
    if (dto.restrictToInstructorId !== undefined)
      values.restrictToInstructorId = dto.restrictToInstructorId;
    if (dto.requiresApproval !== undefined)
      values.requiresApproval = dto.requiresApproval;
    if (dto.totalSeats !== undefined) values.totalSeats = dto.totalSeats;
    if (dto.sponsorName !== undefined) values.sponsorName = dto.sponsorName;
    if (dto.sponsorNotes !== undefined) values.sponsorNotes = dto.sponsorNotes;
    if (dto.referrerRewardType !== undefined)
      values.referrerRewardType = dto.referrerRewardType;
    if (dto.referrerRewardValue !== undefined)
      values.referrerRewardValue = dto.referrerRewardValue?.toString() ?? null;
    if (dto.affiliateId !== undefined) values.affiliateId = dto.affiliateId;
    if (dto.metadata !== undefined) values.metadata = dto.metadata;
    const [row] = await this.db
      .update(schema.promoCampaigns)
      .set(values)
      .where(eq(schema.promoCampaigns.id, id))
      .returning();
    if (dto.courseIds !== undefined)
      await this.setCourseRules(id, dto.courseIds);
    if (dto.categoryIds !== undefined)
      await this.setCategoryRules(id, dto.categoryIds);
    if (dto.userIds !== undefined) await this.setUserRules(id, dto.userIds);
    return row;
  }

  async archiveCampaign(id: string) {
    const [row] = await this.db
      .update(schema.promoCampaigns)
      .set({
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.promoCampaigns.id, id))
      .returning();
    return row;
  }

  async findCampaign(id: string) {
    return this.db.query.promoCampaigns.findFirst({
      where: eq(schema.promoCampaigns.id, id),
    });
  }

  async campaignRules(campaignId: string) {
    const [courseRules, categoryRules, userRules] = await Promise.all([
      this.db
        .select({ courseId: schema.promoCourseRules.courseId })
        .from(schema.promoCourseRules)
        .where(eq(schema.promoCourseRules.campaignId, campaignId)),
      this.db
        .select({ categoryId: schema.promoCategoryRules.categoryId })
        .from(schema.promoCategoryRules)
        .where(eq(schema.promoCategoryRules.campaignId, campaignId)),
      this.db
        .select({ userId: schema.promoUserRules.userId })
        .from(schema.promoUserRules)
        .where(eq(schema.promoUserRules.campaignId, campaignId)),
    ]);
    return {
      courseIds: courseRules.map((r) => r.courseId),
      categoryIds: categoryRules.map((r) => r.categoryId),
      userIds: userRules.map((r) => r.userId),
    };
  }

  async listCampaigns(query: ListCampaignsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const conditions = [];
    if (query.status)
      conditions.push(eq(schema.promoCampaigns.status, query.status));
    if (query.type) conditions.push(eq(schema.promoCampaigns.type, query.type));
    if (query.isAutomatic !== undefined)
      conditions.push(eq(schema.promoCampaigns.isAutomatic, query.isAutomatic));
    if (query.search)
      conditions.push(ilike(schema.promoCampaigns.name, `%${query.search}%`));
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, [totalRow]] = await Promise.all([
      this.db
        .select()
        .from(schema.promoCampaigns)
        .where(where)
        .orderBy(desc(schema.promoCampaigns.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ value: count() })
        .from(schema.promoCampaigns)
        .where(where),
    ]);
    return { items, total: totalRow?.value ?? 0, page, pageSize };
  }

  private async setCourseRules(campaignId: string, courseIds: string[]) {
    await this.db
      .delete(schema.promoCourseRules)
      .where(eq(schema.promoCourseRules.campaignId, campaignId));
    if (courseIds.length)
      await this.db
        .insert(schema.promoCourseRules)
        .values(courseIds.map((courseId) => ({ campaignId, courseId })));
  }

  private async setCategoryRules(campaignId: string, categoryIds: string[]) {
    await this.db
      .delete(schema.promoCategoryRules)
      .where(eq(schema.promoCategoryRules.campaignId, campaignId));
    if (categoryIds.length)
      await this.db
        .insert(schema.promoCategoryRules)
        .values(categoryIds.map((categoryId) => ({ campaignId, categoryId })));
  }

  private async setUserRules(campaignId: string, userIds: string[]) {
    await this.db
      .delete(schema.promoUserRules)
      .where(eq(schema.promoUserRules.campaignId, campaignId));
    if (userIds.length)
      await this.db
        .insert(schema.promoUserRules)
        .values(userIds.map((userId) => ({ campaignId, userId })));
  }

  // ---------------------------------------------------------------------
  // Coupons
  // ---------------------------------------------------------------------

  async createCode(actorId: string, dto: CreateCouponDto & { code: string }) {
    const [row] = await this.db
      .insert(schema.promoCodes)
      .values({
        campaignId: dto.campaignId,
        code: dto.code,
        codeType: dto.codeType ?? 'MANUAL',
        ownerUserId: dto.ownerUserId,
        affiliateId: dto.affiliateId,
        isSingleUse: dto.isSingleUse ?? false,
        maxRedemptions: dto.isSingleUse ? 1 : dto.maxRedemptions,
        maxRedemptionsPerUser: dto.maxRedemptionsPerUser,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        createdBy: actorId,
      })
      .returning();
    return row;
  }

  async bulkCreateCodes(
    actorId: string,
    campaignId: string,
    codes: string[],
    options: {
      codeType?: string;
      isSingleUse?: boolean;
      maxRedemptions?: number;
      maxRedemptionsPerUser?: number;
      validFrom?: string;
      validUntil?: string;
    },
  ) {
    return this.db
      .insert(schema.promoCodes)
      .values(
        codes.map((code) => ({
          campaignId,
          code,
          codeType: (options.codeType ??
            'MANUAL') as (typeof schema.promoCodes.$inferInsert)['codeType'],
          isSingleUse: options.isSingleUse ?? false,
          maxRedemptions: options.isSingleUse ? 1 : options.maxRedemptions,
          maxRedemptionsPerUser: options.maxRedemptionsPerUser,
          validFrom: options.validFrom
            ? new Date(options.validFrom)
            : undefined,
          validUntil: options.validUntil
            ? new Date(options.validUntil)
            : undefined,
          createdBy: actorId,
        })),
      )
      .returning();
  }

  async codeExists(code: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: schema.promoCodes.id })
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.code, code))
      .limit(1);
    return !!row;
  }

  async findCode(id: string) {
    return this.db.query.promoCodes.findFirst({
      where: eq(schema.promoCodes.id, id),
    });
  }

  async updateCode(id: string, dto: UpdateCouponDto) {
    const values: Partial<typeof schema.promoCodes.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (dto.status !== undefined) values.status = dto.status;
    if (dto.maxRedemptions !== undefined)
      values.maxRedemptions = dto.maxRedemptions;
    if (dto.maxRedemptionsPerUser !== undefined)
      values.maxRedemptionsPerUser = dto.maxRedemptionsPerUser;
    if (dto.validFrom !== undefined)
      values.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validUntil !== undefined)
      values.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    const [row] = await this.db
      .update(schema.promoCodes)
      .set(values)
      .where(eq(schema.promoCodes.id, id))
      .returning();
    return row;
  }

  async archiveCode(id: string) {
    const [row] = await this.db
      .update(schema.promoCodes)
      .set({ status: 'REVOKED', updatedAt: new Date() })
      .where(eq(schema.promoCodes.id, id))
      .returning();
    return row;
  }

  async listCodes(query: ListCouponsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const conditions = [];
    if (query.campaignId)
      conditions.push(eq(schema.promoCodes.campaignId, query.campaignId));
    if (query.status)
      conditions.push(eq(schema.promoCodes.status, query.status));
    if (query.codeType)
      conditions.push(eq(schema.promoCodes.codeType, query.codeType));
    if (query.search)
      conditions.push(ilike(schema.promoCodes.code, `%${query.search}%`));
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, [totalRow]] = await Promise.all([
      this.db
        .select()
        .from(schema.promoCodes)
        .where(where)
        .orderBy(desc(schema.promoCodes.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db.select({ value: count() }).from(schema.promoCodes).where(where),
    ]);
    return { items, total: totalRow?.value ?? 0, page, pageSize };
  }

  async findActiveReferralCampaign() {
    return this.db.query.promoCampaigns.findFirst({
      where: and(
        eq(schema.promoCampaigns.type, 'REFERRAL_REWARD'),
        eq(schema.promoCampaigns.status, 'ACTIVE'),
        isNull(schema.promoCampaigns.archivedAt),
      ),
      orderBy: desc(schema.promoCampaigns.createdAt),
    });
  }

  async findOrCreateReferralCode(
    campaignId: string,
    userId: string,
    generateCode: () => string,
  ): Promise<{ code: string; created: boolean }> {
    const [existing] = await this.db
      .select({ code: schema.promoCodes.code })
      .from(schema.promoCodes)
      .where(
        and(
          eq(schema.promoCodes.ownerUserId, userId),
          eq(schema.promoCodes.campaignId, campaignId),
          eq(schema.promoCodes.codeType, 'REFERRAL'),
        ),
      )
      .limit(1);
    if (existing) return { code: existing.code, created: false };
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = generateCode();
      if (await this.codeExists(code)) continue;
      await this.db.insert(schema.promoCodes).values({
        campaignId,
        code,
        codeType: 'REFERRAL',
        ownerUserId: userId,
        createdBy: userId,
      });
      return { code, created: true };
    }
    throw new Error('REFERRAL_CODE_GENERATION_EXHAUSTED');
  }

  // ---------------------------------------------------------------------
  // Redemption
  // ---------------------------------------------------------------------

  /**
   * Inserts the redemption row. When `status` is CONFIRMED (the common case
   * - no approval required), campaign/code/affiliate usage counters are
   * incremented immediately in the same transaction. When RESERVED (a
   * `requiresApproval` scholarship-style campaign), counters are
   * deliberately deferred to `confirmRedemption` so a pending-then-rejected
   * request never permanently consumes a limited-inventory slot.
   */
  async recordRedemption(input: {
    campaignId: string;
    codeId: string | null;
    studentId: string;
    courseId: string;
    status: 'RESERVED' | 'CONFIRMED';
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    currency: string;
    referralOwnerId?: string | null;
    referrerRewardAmount?: number | null;
    affiliateId?: string | null;
    affiliateCommission?: number | null;
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
  }) {
    return this.db.transaction(async (tx) => {
      const [redemption] = await tx
        .insert(schema.promoRedemptions)
        .values({
          campaignId: input.campaignId,
          codeId: input.codeId,
          studentId: input.studentId,
          courseId: input.courseId,
          status: input.status,
          originalPrice: input.originalPrice.toString(),
          discountAmount: input.discountAmount.toString(),
          finalPrice: input.finalPrice.toString(),
          currency: input.currency,
          referralOwnerId: input.referralOwnerId ?? null,
          referrerRewardAmount: input.referrerRewardAmount?.toString(),
          affiliateId: input.affiliateId ?? null,
          affiliateCommissionAmount: input.affiliateCommission?.toString(),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          deviceType: input.deviceType,
        })
        .returning();
      if (input.status === 'CONFIRMED')
        await this.applyRedemptionCounters(tx, {
          campaignId: input.campaignId,
          codeId: input.codeId,
          studentId: input.studentId,
          affiliateId: input.affiliateId ?? null,
          finalPrice: input.finalPrice,
          affiliateCommission: input.affiliateCommission ?? 0,
        });
      return redemption;
    });
  }

  /** Approves a RESERVED (pending-approval) redemption: locks the row, flips it to CONFIRMED, and only now applies usage counters. */
  async confirmRedemption(id: string, actorId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM promo_redemptions WHERE id = ${id} FOR UPDATE`,
      );
      const redemption = await tx.query.promoRedemptions.findFirst({
        where: eq(schema.promoRedemptions.id, id),
      });
      if (!redemption) throw new Error('REDEMPTION_NOT_FOUND');
      if (redemption.status !== 'RESERVED')
        throw new Error('REDEMPTION_NOT_PENDING');
      const [updated] = await tx
        .update(schema.promoRedemptions)
        .set({
          status: 'CONFIRMED',
          approvedBy: actorId,
          approvalDecisionAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.promoRedemptions.id, id))
        .returning();
      await this.applyRedemptionCounters(tx, {
        campaignId: redemption.campaignId,
        codeId: redemption.codeId,
        studentId: redemption.studentId,
        affiliateId: redemption.affiliateId,
        finalPrice: Number(redemption.finalPrice),
        affiliateCommission: Number(redemption.affiliateCommissionAmount ?? 0),
      });
      return updated;
    });
  }

  /** Rejects a RESERVED redemption. No counters were ever applied, so none need reverting. */
  async rejectRedemption(id: string, actorId: string, reason: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM promo_redemptions WHERE id = ${id} FOR UPDATE`,
      );
      const redemption = await tx.query.promoRedemptions.findFirst({
        where: eq(schema.promoRedemptions.id, id),
      });
      if (!redemption) throw new Error('REDEMPTION_NOT_FOUND');
      if (redemption.status !== 'RESERVED')
        throw new Error('REDEMPTION_NOT_PENDING');
      const [updated] = await tx
        .update(schema.promoRedemptions)
        .set({
          status: 'CANCELLED',
          approvedBy: actorId,
          approvalDecisionAt: new Date(),
          rejectionReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(schema.promoRedemptions.id, id))
        .returning();
      return updated;
    });
  }

  findRedemption(id: string) {
    return this.db.query.promoRedemptions.findFirst({
      where: eq(schema.promoRedemptions.id, id),
    });
  }

  async listPendingRedemptions(page: number, pageSize: number) {
    const where = eq(schema.promoRedemptions.status, 'RESERVED');
    const [items, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: schema.promoRedemptions.id,
          campaignId: schema.promoRedemptions.campaignId,
          campaignName: schema.promoCampaigns.name,
          codeId: schema.promoRedemptions.codeId,
          code: schema.promoCodes.code,
          studentId: schema.promoRedemptions.studentId,
          courseId: schema.promoRedemptions.courseId,
          courseTitle: schema.courses.title,
          originalPrice: schema.promoRedemptions.originalPrice,
          discountAmount: schema.promoRedemptions.discountAmount,
          finalPrice: schema.promoRedemptions.finalPrice,
          currency: schema.promoRedemptions.currency,
          redeemedAt: schema.promoRedemptions.redeemedAt,
        })
        .from(schema.promoRedemptions)
        .innerJoin(
          schema.promoCampaigns,
          eq(schema.promoCampaigns.id, schema.promoRedemptions.campaignId),
        )
        .innerJoin(
          schema.courses,
          eq(schema.courses.id, schema.promoRedemptions.courseId),
        )
        .leftJoin(
          schema.promoCodes,
          eq(schema.promoCodes.id, schema.promoRedemptions.codeId),
        )
        .where(where)
        .orderBy(schema.promoRedemptions.redeemedAt)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ value: count() })
        .from(schema.promoRedemptions)
        .where(where),
    ]);
    return { items, total: totalRow?.value ?? 0, page, pageSize };
  }

  private async applyRedemptionCounters(
    tx: Parameters<Parameters<typeof this.db.transaction>[0]>[0],
    input: {
      campaignId: string;
      codeId: string | null;
      studentId: string;
      affiliateId: string | null;
      finalPrice: number;
      affiliateCommission: number;
    },
  ) {
    // Serialise a student's own redemptions while the conditional counter
    // updates below serialise the last available campaign/code slot. This
    // makes validation previews non-consuming but redemption first-come-safe.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`promo:${input.campaignId}:${input.studentId}`}))`,
    );
    const [campaign] = await tx
      .select({
        maxPerUser: schema.promoCampaigns.maxRedemptionsPerUser,
      })
      .from(schema.promoCampaigns)
      .where(eq(schema.promoCampaigns.id, input.campaignId));
    const [campaignUses] = await tx
      .select({ value: count() })
      .from(schema.promoRedemptions)
      .where(
        and(
          eq(schema.promoRedemptions.campaignId, input.campaignId),
          eq(schema.promoRedemptions.studentId, input.studentId),
          eq(schema.promoRedemptions.status, 'CONFIRMED'),
        ),
      );
    if (!campaign || Number(campaignUses?.value ?? 0) > campaign.maxPerUser)
      throw new Error('PROMOTION_REDEMPTION_LIMIT_REACHED');
    if (input.codeId) {
      const [code] = await tx
        .select({
          maxPerUser: schema.promoCodes.maxRedemptionsPerUser,
          singleUse: schema.promoCodes.isSingleUse,
        })
        .from(schema.promoCodes)
        .where(eq(schema.promoCodes.id, input.codeId));
      const [codeUses] = await tx
        .select({ value: count() })
        .from(schema.promoRedemptions)
        .where(
          and(
            eq(schema.promoRedemptions.codeId, input.codeId),
            eq(schema.promoRedemptions.studentId, input.studentId),
            eq(schema.promoRedemptions.status, 'CONFIRMED'),
          ),
        );
      const limit = code?.maxPerUser ?? (code?.singleUse ? 1 : null);
      if (!code || (limit !== null && Number(codeUses?.value ?? 0) > limit))
        throw new Error('PROMOTION_REDEMPTION_LIMIT_REACHED');
    }
    const updatedCampaign = await tx
      .update(schema.promoCampaigns)
      .set({
        redemptionCount: sql`${schema.promoCampaigns.redemptionCount} + 1`,
        seatsUsed: sql`${schema.promoCampaigns.seatsUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.promoCampaigns.id, input.campaignId),
          sql`(${schema.promoCampaigns.maxRedemptions} IS NULL OR ${schema.promoCampaigns.redemptionCount} < ${schema.promoCampaigns.maxRedemptions})`,
          sql`(${schema.promoCampaigns.totalSeats} IS NULL OR ${schema.promoCampaigns.seatsUsed} < ${schema.promoCampaigns.totalSeats})`,
        ),
      )
      .returning({ id: schema.promoCampaigns.id });
    if (!updatedCampaign.length)
      throw new Error('PROMOTION_REDEMPTION_LIMIT_REACHED');
    if (input.codeId) {
      const updatedCode = await tx
        .update(schema.promoCodes)
        .set({
          redemptionCount: sql`${schema.promoCodes.redemptionCount} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.promoCodes.id, input.codeId),
            sql`(${schema.promoCodes.maxRedemptions} IS NULL OR ${schema.promoCodes.redemptionCount} < ${schema.promoCodes.maxRedemptions})`,
          ),
        )
        .returning({ id: schema.promoCodes.id });
      if (!updatedCode.length)
        throw new Error('PROMOTION_REDEMPTION_LIMIT_REACHED');
    }
    if (input.affiliateId)
      await tx
        .update(schema.promoAffiliates)
        .set({
          totalEnrollments: sql`${schema.promoAffiliates.totalEnrollments} + 1`,
          totalRevenue: sql`${schema.promoAffiliates.totalRevenue} + ${input.finalPrice}`,
          totalCommission: sql`${schema.promoAffiliates.totalCommission} + ${input.affiliateCommission}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.promoAffiliates.id, input.affiliateId));
  }

  async listMyRedemptions(userId: string, query: ListRedemptionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: schema.promoRedemptions.id,
          courseId: schema.promoRedemptions.courseId,
          courseTitle: schema.courses.title,
          campaignId: schema.promoRedemptions.campaignId,
          campaignName: schema.promoCampaigns.name,
          code: schema.promoCodes.code,
          status: schema.promoRedemptions.status,
          originalPrice: schema.promoRedemptions.originalPrice,
          discountAmount: schema.promoRedemptions.discountAmount,
          finalPrice: schema.promoRedemptions.finalPrice,
          currency: schema.promoRedemptions.currency,
          redeemedAt: schema.promoRedemptions.redeemedAt,
        })
        .from(schema.promoRedemptions)
        .innerJoin(
          schema.courses,
          eq(schema.courses.id, schema.promoRedemptions.courseId),
        )
        .innerJoin(
          schema.promoCampaigns,
          eq(schema.promoCampaigns.id, schema.promoRedemptions.campaignId),
        )
        .leftJoin(
          schema.promoCodes,
          eq(schema.promoCodes.id, schema.promoRedemptions.codeId),
        )
        .where(eq(schema.promoRedemptions.studentId, userId))
        .orderBy(desc(schema.promoRedemptions.redeemedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ value: count() })
        .from(schema.promoRedemptions)
        .where(eq(schema.promoRedemptions.studentId, userId)),
    ]);
    return { items, total: totalRow?.value ?? 0, page, pageSize };
  }

  // ---------------------------------------------------------------------
  // Affiliates
  // ---------------------------------------------------------------------

  async createAffiliate(
    actorId: string,
    dto: {
      userId?: string;
      name: string;
      email: string;
      commissionType?: string;
      commissionRate?: number;
      commissionFixedAmount?: number;
      notes?: string;
    },
  ) {
    const [row] = await this.db
      .insert(schema.promoAffiliates)
      .values({
        userId: dto.userId,
        name: dto.name,
        email: dto.email,
        commissionType: (dto.commissionType ??
          'PERCENTAGE') as (typeof schema.promoAffiliates.$inferInsert)['commissionType'],
        commissionRate: dto.commissionRate?.toString(),
        commissionFixedAmount: dto.commissionFixedAmount?.toString(),
        notes: dto.notes,
        createdBy: actorId,
      })
      .returning();
    return row;
  }

  async updateAffiliate(
    id: string,
    dto: {
      status?: string;
      commissionType?: string;
      commissionRate?: number;
      commissionFixedAmount?: number;
      notes?: string;
    },
  ) {
    const values: Partial<typeof schema.promoAffiliates.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (dto.status !== undefined)
      values.status =
        dto.status as (typeof schema.promoAffiliates.$inferInsert)['status'];
    if (dto.commissionType !== undefined)
      values.commissionType =
        dto.commissionType as (typeof schema.promoAffiliates.$inferInsert)['commissionType'];
    if (dto.commissionRate !== undefined)
      values.commissionRate = dto.commissionRate.toString();
    if (dto.commissionFixedAmount !== undefined)
      values.commissionFixedAmount = dto.commissionFixedAmount.toString();
    if (dto.notes !== undefined) values.notes = dto.notes;
    const [row] = await this.db
      .update(schema.promoAffiliates)
      .set(values)
      .where(eq(schema.promoAffiliates.id, id))
      .returning();
    return row;
  }

  async findAffiliate(id: string) {
    return this.db.query.promoAffiliates.findFirst({
      where: eq(schema.promoAffiliates.id, id),
    });
  }

  async findAffiliateByCodeId(codeId: string) {
    const [row] = await this.db
      .select({ affiliateId: schema.promoCodes.affiliateId })
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.id, codeId))
      .limit(1);
    return row?.affiliateId ?? null;
  }

  async recordAffiliateClick(affiliateId: string) {
    await this.db
      .update(schema.promoAffiliates)
      .set({
        totalClicks: sql`${schema.promoAffiliates.totalClicks} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.promoAffiliates.id, affiliateId));
  }

  async listAffiliates(query: ListAffiliatesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const conditions = [];
    if (query.status)
      conditions.push(eq(schema.promoAffiliates.status, query.status));
    if (query.search)
      conditions.push(
        or(
          ilike(schema.promoAffiliates.name, `%${query.search}%`),
          ilike(schema.promoAffiliates.email, `%${query.search}%`),
        ),
      );
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, [totalRow]] = await Promise.all([
      this.db
        .select()
        .from(schema.promoAffiliates)
        .where(where)
        .orderBy(desc(schema.promoAffiliates.totalRevenue))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ value: count() })
        .from(schema.promoAffiliates)
        .where(where),
    ]);
    return { items, total: totalRow?.value ?? 0, page, pageSize };
  }

  // ---------------------------------------------------------------------
  // Usage logs
  // ---------------------------------------------------------------------

  async logUsage(entry: {
    campaignId?: string | null;
    codeId?: string | null;
    actorId?: string | null;
    action: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    await this.db.insert(schema.promoUsageLogs).values({
      campaignId: entry.campaignId ?? null,
      codeId: entry.codeId ?? null,
      actorId: entry.actorId ?? null,
      action: entry.action,
      metadata: entry.metadata ?? {},
      ipAddress: entry.ipAddress,
    });
  }

  // ---------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------

  async analyticsOverview() {
    const [campaignCounts] = await this.db
      .select({
        active: sql<number>`count(*) filter (where ${schema.promoCampaigns.status} = 'ACTIVE')::int`,
        expired: sql<number>`count(*) filter (where ${schema.promoCampaigns.status} = 'EXPIRED' or (${schema.promoCampaigns.endsAt} is not null and ${schema.promoCampaigns.endsAt} < now()))::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(schema.promoCampaigns);
    const [codeCounts] = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        redeemed: sql<number>`count(*) filter (where ${schema.promoCodes.redemptionCount} > 0)::int`,
        unused: sql<number>`count(*) filter (where ${schema.promoCodes.redemptionCount} = 0)::int`,
      })
      .from(schema.promoCodes);
    const [redemptionTotals] = await this.db
      .select({
        revenue: sql<string>`coalesce(sum(${schema.promoRedemptions.finalPrice}) filter (where ${schema.promoRedemptions.status} = 'CONFIRMED'), 0)::text`,
        discountGiven: sql<string>`coalesce(sum(${schema.promoRedemptions.discountAmount}) filter (where ${schema.promoRedemptions.status} = 'CONFIRMED'), 0)::text`,
        redemptions: sql<number>`count(*) filter (where ${schema.promoRedemptions.status} = 'CONFIRMED')::int`,
      })
      .from(schema.promoRedemptions);
    const [validationAttempts] = await this.db
      .select({ value: count() })
      .from(schema.promoUsageLogs)
      .where(
        inArray(schema.promoUsageLogs.action, [
          'COUPON_REDEEMED',
          'COUPON_VALIDATION_FAILED',
          'COUPON_EXPIRED',
        ]),
      );
    const attempts = validationAttempts?.value ?? 0;
    const redemptions = redemptionTotals?.redemptions ?? 0;
    return {
      campaigns: campaignCounts ?? { active: 0, expired: 0, total: 0 },
      coupons: codeCounts ?? { total: 0, redeemed: 0, unused: 0 },
      revenueGenerated: redemptionTotals?.revenue ?? '0',
      discountGiven: redemptionTotals?.discountGiven ?? '0',
      totalRedemptions: redemptions,
      conversionRate:
        attempts > 0 ? Number(((redemptions / attempts) * 100).toFixed(2)) : 0,
    };
  }

  async topCampaigns(limit: number) {
    return this.db
      .select({
        campaignId: schema.promoRedemptions.campaignId,
        campaignName: schema.promoCampaigns.name,
        redemptions: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${schema.promoRedemptions.finalPrice}), 0)::text`,
      })
      .from(schema.promoRedemptions)
      .innerJoin(
        schema.promoCampaigns,
        eq(schema.promoCampaigns.id, schema.promoRedemptions.campaignId),
      )
      .where(eq(schema.promoRedemptions.status, 'CONFIRMED'))
      .groupBy(schema.promoRedemptions.campaignId, schema.promoCampaigns.name)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
  }

  async topAffiliates(limit: number) {
    return this.db
      .select()
      .from(schema.promoAffiliates)
      .orderBy(desc(schema.promoAffiliates.totalRevenue))
      .limit(limit);
  }

  async topReferralCodes(limit: number) {
    return this.db
      .select()
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.codeType, 'REFERRAL'))
      .orderBy(desc(schema.promoCodes.redemptionCount))
      .limit(limit);
  }

  async courseTitle(courseId: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ title: schema.courses.title })
      .from(schema.courses)
      .where(eq(schema.courses.id, courseId))
      .limit(1);
    return row?.title;
  }
}
