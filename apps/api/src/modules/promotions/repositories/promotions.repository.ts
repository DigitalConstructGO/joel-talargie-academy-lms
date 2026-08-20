import { Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
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
  CreateCouponDto,
  ListCouponsDto,
  UpdateCouponDto,
} from '../dto/coupon.dto';
import type { ListAffiliatesDto } from '../dto/affiliate.dto';
import type {
  ListRedemptionsDto,
  ListCodeRedemptionsDto,
} from '../dto/redemption.dto';

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

  async findRuleSetByCode(
    normalizedCode: string,
    userId: string,
  ): Promise<EngineRuleSet | null> {
    const [row] = await this.db
      .select({ code: schema.promoCodes })
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.code, normalizedCode))
      .limit(1);
    if (!row) return null;
    return this.buildRuleSet(row.code, userId);
  }

  private async buildRuleSet(
    code: typeof schema.promoCodes.$inferSelect,
    userId: string,
  ): Promise<EngineRuleSet> {
    const [
      courseRuleIds,
      categoryRuleIds,
      userRuleIds,
      redemptionCounts,
      userCount,
    ] = await Promise.all([
      this.db
        .select({ courseId: schema.promoCodeCourseRules.courseId })
        .from(schema.promoCodeCourseRules)
        .where(eq(schema.promoCodeCourseRules.codeId, code.id)),
      this.db
        .select({ categoryId: schema.promoCodeCategoryRules.categoryId })
        .from(schema.promoCodeCategoryRules)
        .where(eq(schema.promoCodeCategoryRules.codeId, code.id)),
      this.db
        .select({ userId: schema.promoCodeUserRules.userId })
        .from(schema.promoCodeUserRules)
        .where(eq(schema.promoCodeUserRules.codeId, code.id)),
      this.userRedemptionCountForCode(userId, code.id),
      this.distinctUserCountForCode(code.id),
    ]);
    return this.presentRuleSet(
      code,
      courseRuleIds.map((r) => r.courseId),
      categoryRuleIds.map((r) => r.categoryId),
      userRuleIds.map((r) => r.userId),
      redemptionCounts,
      userCount,
    );
  }

  private presentRuleSet(
    code: typeof schema.promoCodes.$inferSelect,
    courseRuleCourseIds: string[],
    categoryRuleCategoryIds: string[],
    userRuleUserIds: string[],
    userRedemptionCountForCode: number,
    userCountForCode: number,
  ): EngineRuleSet {
    return {
      promoCode: {
        id: code.id,
        code: code.code,
        codeType: code.codeType,
        status: code.status,
        discountType: code.discountType,
        discountValue: code.discountValue,
        ownerUserId: code.ownerUserId,
        affiliateId: code.affiliateId,
        isSingleUse: code.isSingleUse,
        maxUsers: code.maxUsers,
        redemptionCount: code.redemptionCount,
        validFrom: code.validFrom,
        validUntil: code.validUntil,
      },
      courseRuleCourseIds,
      categoryRuleCategoryIds,
      userRuleUserIds,
      userRedemptionCountForCode,
      userCountForCode,
    };
  }

  private async userRedemptionCountForCode(
    userId: string,
    codeId: string,
  ): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(schema.promoRedemptions)
      .where(
        and(
          eq(schema.promoRedemptions.studentId, userId),
          eq(schema.promoRedemptions.codeId, codeId),
          inArray(schema.promoRedemptions.status, ACTIVE_REDEMPTION_STATUSES),
        ),
      );
    return row?.value ?? 0;
  }

  private async distinctUserCountForCode(codeId: string): Promise<number> {
    const [row] = await this.db
      .select({
        value: sql<number>`count(distinct ${schema.promoRedemptions.studentId})::int`,
      })
      .from(schema.promoRedemptions)
      .where(
        and(
          eq(schema.promoRedemptions.codeId, codeId),
          inArray(schema.promoRedemptions.status, ACTIVE_REDEMPTION_STATUSES),
        ),
      );
    return row?.value ?? 0;
  }

  // ---------------------------------------------------------------------
  // Coupons
  // ---------------------------------------------------------------------

  async createCode(actorId: string, dto: CreateCouponDto & { code: string }) {
    const [row] = await this.db
      .insert(schema.promoCodes)
      .values({
        code: dto.code,
        codeType: dto.codeType ?? 'MANUAL',
        status: dto.status ?? 'ACTIVE',
        discountType: dto.discountType ?? 'PERCENTAGE',
        discountValue: (dto.discountValue ?? 0).toString(),
        ownerUserId: dto.ownerUserId,
        affiliateId: dto.affiliateId,
        isSingleUse: dto.isSingleUse ?? false,
        maxUsers: dto.maxUsers,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        createdBy: actorId,
      })
      .returning();
    if (dto.courseIds?.length)
      await this.setCodeCourseRules(row.id, dto.courseIds);
    if (dto.categoryIds?.length)
      await this.setCodeCategoryRules(row.id, dto.categoryIds);
    if (dto.userIds?.length) await this.setCodeUserRules(row.id, dto.userIds);
    return row;
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
    if (dto.discountType !== undefined) values.discountType = dto.discountType;
    if (dto.discountValue !== undefined)
      values.discountValue = dto.discountValue.toString();
    if (dto.isSingleUse !== undefined) values.isSingleUse = dto.isSingleUse;
    if (dto.maxUsers !== undefined) values.maxUsers = dto.maxUsers;
    if (dto.validFrom !== undefined)
      values.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validUntil !== undefined)
      values.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    const [row] = await this.db
      .update(schema.promoCodes)
      .set(values)
      .where(eq(schema.promoCodes.id, id))
      .returning();
    if (dto.courseIds !== undefined)
      await this.setCodeCourseRules(id, dto.courseIds);
    if (dto.categoryIds !== undefined)
      await this.setCodeCategoryRules(id, dto.categoryIds);
    if (dto.userIds !== undefined) await this.setCodeUserRules(id, dto.userIds);
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

  /**
   * A coupon plus its own targeting rules. Feeds the admin coupon-detail view;
   * validation still goes through the engine.
   */
  async findCodeWithRules(id: string) {
    const code = await this.db.query.promoCodes.findFirst({
      where: eq(schema.promoCodes.id, id),
    });
    if (!code) return null;
    const [courseIds, categoryIds, userIds] = await Promise.all([
      this.db
        .select({ courseId: schema.promoCodeCourseRules.courseId })
        .from(schema.promoCodeCourseRules)
        .where(eq(schema.promoCodeCourseRules.codeId, id))
        .then((rows) => rows.map((row) => row.courseId)),
      this.db
        .select({ categoryId: schema.promoCodeCategoryRules.categoryId })
        .from(schema.promoCodeCategoryRules)
        .where(eq(schema.promoCodeCategoryRules.codeId, id))
        .then((rows) => rows.map((row) => row.categoryId)),
      this.db
        .select({ userId: schema.promoCodeUserRules.userId })
        .from(schema.promoCodeUserRules)
        .where(eq(schema.promoCodeUserRules.codeId, id))
        .then((rows) => rows.map((row) => row.userId)),
    ]);
    return {
      code,
      rules: { courseIds, categoryIds, userIds },
    };
  }

  /**
   * Real redemption history for a single coupon, joined to the student, course,
   * and payment records. Admin usage-history view - never falls back to mock data.
   */
  async listCodeRedemptions(codeId: string, query: ListCodeRedemptionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const conditions = [eq(schema.promoRedemptions.codeId, codeId)];
    if (query.status)
      conditions.push(eq(schema.promoRedemptions.status, query.status));
    if (query.courseId)
      conditions.push(eq(schema.promoRedemptions.courseId, query.courseId));
    if (query.from)
      conditions.push(
        gte(schema.promoRedemptions.redeemedAt, new Date(query.from)),
      );
    if (query.to)
      conditions.push(
        lte(schema.promoRedemptions.redeemedAt, new Date(query.to)),
      );
    if (query.search) {
      const term = `%${query.search}%`;
      const searchClause = or(
        ilike(schema.users.email, term),
        ilike(schema.userProfiles.firstName, term),
        ilike(schema.userProfiles.lastName, term),
        ilike(schema.courses.title, term),
        ilike(schema.payments.transactionId, term),
      );
      if (searchClause) conditions.push(searchClause);
    }
    const where = and(...conditions);
    const [items, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: schema.promoRedemptions.id,
          status: schema.promoRedemptions.status,
          courseId: schema.promoRedemptions.courseId,
          courseTitle: schema.courses.title,
          code: schema.promoCodes.code,
          studentId: schema.promoRedemptions.studentId,
          studentEmail: schema.users.email,
          studentFirstName: schema.userProfiles.firstName,
          studentLastName: schema.userProfiles.lastName,
          originalPrice: schema.promoRedemptions.originalPrice,
          discountAmount: schema.promoRedemptions.discountAmount,
          finalPrice: schema.promoRedemptions.finalPrice,
          currency: schema.promoRedemptions.currency,
          redeemedAt: schema.promoRedemptions.redeemedAt,
          enrollmentId: schema.promoRedemptions.enrollmentId,
          paymentId: schema.promoRedemptions.paymentId,
          transactionId: schema.payments.transactionId,
        })
        .from(schema.promoRedemptions)
        .innerJoin(
          schema.promoCodes,
          eq(schema.promoCodes.id, schema.promoRedemptions.codeId),
        )
        .innerJoin(
          schema.users,
          eq(schema.users.id, schema.promoRedemptions.studentId),
        )
        .leftJoin(
          schema.userProfiles,
          eq(schema.userProfiles.userId, schema.users.id),
        )
        .innerJoin(
          schema.courses,
          eq(schema.courses.id, schema.promoRedemptions.courseId),
        )
        .leftJoin(
          schema.payments,
          eq(schema.payments.id, schema.promoRedemptions.paymentId),
        )
        .where(where)
        .orderBy(desc(schema.promoRedemptions.redeemedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ value: count() })
        .from(schema.promoRedemptions)
        .where(where),
    ]);
    return { items, total: totalRow?.value ?? 0, page, pageSize };
  }

  private async setCodeCourseRules(codeId: string, courseIds: string[]) {
    await this.db
      .delete(schema.promoCodeCourseRules)
      .where(eq(schema.promoCodeCourseRules.codeId, codeId));
    if (courseIds.length)
      await this.db
        .insert(schema.promoCodeCourseRules)
        .values(courseIds.map((courseId) => ({ codeId, courseId })));
  }

  private async setCodeCategoryRules(codeId: string, categoryIds: string[]) {
    await this.db
      .delete(schema.promoCodeCategoryRules)
      .where(eq(schema.promoCodeCategoryRules.codeId, codeId));
    if (categoryIds.length)
      await this.db
        .insert(schema.promoCodeCategoryRules)
        .values(categoryIds.map((categoryId) => ({ codeId, categoryId })));
  }

  private async setCodeUserRules(codeId: string, userIds: string[]) {
    await this.db
      .delete(schema.promoCodeUserRules)
      .where(eq(schema.promoCodeUserRules.codeId, codeId));
    if (userIds.length)
      await this.db
        .insert(schema.promoCodeUserRules)
        .values(userIds.map((userId) => ({ codeId, userId })));
  }

  // ---------------------------------------------------------------------
  // Redemption
  // ---------------------------------------------------------------------

  /**
   * Inserts the redemption row (always CONFIRMED - there is no approval flow)
   * and immediately applies the code/affiliate usage counters in the same
   * transaction, serialized so the last available slot is first-come-safe.
   */
  async recordRedemption(input: {
    codeId: string;
    studentId: string;
    courseId: string;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    currency: string;
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
          codeId: input.codeId,
          studentId: input.studentId,
          courseId: input.courseId,
          status: 'CONFIRMED',
          originalPrice: input.originalPrice.toString(),
          discountAmount: input.discountAmount.toString(),
          finalPrice: input.finalPrice.toString(),
          currency: input.currency,
          affiliateId: input.affiliateId ?? null,
          affiliateCommissionAmount: input.affiliateCommission?.toString(),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          deviceType: input.deviceType,
        })
        .returning();
      await this.applyRedemptionCounters(tx, {
        codeId: input.codeId,
        studentId: input.studentId,
        affiliateId: input.affiliateId ?? null,
        finalPrice: input.finalPrice,
        affiliateCommission: input.affiliateCommission ?? 0,
      });
      return redemption;
    });
  }

  private async applyRedemptionCounters(
    tx: Parameters<Parameters<typeof this.db.transaction>[0]>[0],
    input: {
      codeId: string;
      studentId: string;
      affiliateId: string | null;
      finalPrice: number;
      affiliateCommission: number;
    },
  ) {
    // Serialise a student's own redemptions for a code while the conditional
    // counter update below serialises the last available code slot. This
    // makes validation previews non-consuming but redemption first-come-safe.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`promo:${input.codeId}:${input.studentId}`}))`,
    );
    const [code] = await tx
      .select({
        singleUse: schema.promoCodes.isSingleUse,
        maxUsers: schema.promoCodes.maxUsers,
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
    const limit = code?.singleUse ? 1 : null;
    if (!code || (limit !== null && Number(codeUses?.value ?? 0) > limit))
      throw new Error('PROMOTION_REDEMPTION_LIMIT_REACHED');
    // "First N users" cap. The current student's row was already inserted in
    // this transaction, so the distinct count below includes them - a brand-new
    // student pushes the count to (distinct + 1) while a returning student keeps
    // it unchanged. The advisory lock serialises concurrent first-time users so
    // the last available slot is first-come-safe.
    if (code.maxUsers !== null) {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`promo:users:${input.codeId}`}))`,
      );
      const [usedUsers] = await tx
        .select({
          value: sql<number>`count(distinct ${schema.promoRedemptions.studentId})::int`,
        })
        .from(schema.promoRedemptions)
        .where(
          and(
            eq(schema.promoRedemptions.codeId, input.codeId),
            eq(schema.promoRedemptions.status, 'CONFIRMED'),
          ),
        );
      if ((usedUsers?.value ?? 0) > code.maxUsers)
        throw new Error('PROMOTION_REDEMPTION_LIMIT_REACHED');
    }
    const updatedCode = await tx
      .update(schema.promoCodes)
      .set({
        redemptionCount: sql`${schema.promoCodes.redemptionCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.promoCodes.id, input.codeId))
      .returning({ id: schema.promoCodes.id });
    if (!updatedCode.length)
      throw new Error('PROMOTION_REDEMPTION_LIMIT_REACHED');
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
    codeId?: string | null;
    actorId?: string | null;
    action: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    await this.db.insert(schema.promoUsageLogs).values({
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
    const [codeCounts] = await this.db
      .select({
        active: sql<number>`count(*) filter (where ${schema.promoCodes.status} = 'ACTIVE' and (${schema.promoCodes.validFrom} is null or ${schema.promoCodes.validFrom} <= now()) and (${schema.promoCodes.validUntil} is null or ${schema.promoCodes.validUntil} > now()))::int`,
        expired: sql<number>`count(*) filter (where ${schema.promoCodes.status} = 'EXPIRED' or (${schema.promoCodes.validUntil} is not null and ${schema.promoCodes.validUntil} <= now()))::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(schema.promoCodes);
    const [couponCounts] = await this.db
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
      codes: codeCounts ?? { active: 0, expired: 0, total: 0 },
      coupons: couponCounts ?? { total: 0, redeemed: 0, unused: 0 },
      revenueGenerated: redemptionTotals?.revenue ?? '0',
      discountGiven: redemptionTotals?.discountGiven ?? '0',
      totalRedemptions: redemptions,
      conversionRate:
        attempts > 0 ? Number(((redemptions / attempts) * 100).toFixed(2)) : 0,
    };
  }

  async topCodes(limit: number) {
    return this.db
      .select({
        codeId: schema.promoCodes.id,
        code: schema.promoCodes.code,
        redemptions: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${schema.promoRedemptions.finalPrice}), 0)::text`,
      })
      .from(schema.promoRedemptions)
      .innerJoin(
        schema.promoCodes,
        eq(schema.promoCodes.id, schema.promoRedemptions.codeId),
      )
      .where(eq(schema.promoRedemptions.status, 'CONFIRMED'))
      .groupBy(schema.promoCodes.id, schema.promoCodes.code)
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

  async courseTitle(courseId: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ title: schema.courses.title })
      .from(schema.courses)
      .where(eq(schema.courses.id, courseId))
      .limit(1);
    return row?.title;
  }
}
