import { and, count, desc, eq, gt, ilike, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { schema } from './schema/index.ts';
import type { AcademyDatabase } from './queries.ts';
export type ManagedUserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
const safeUserColumns = {
  id: schema.users.id,
  email: schema.users.email,
  status: schema.users.status,
  emailVerified: schema.users.emailVerified,
  provider: schema.users.provider,
  avatarUrl: schema.users.avatarUrl,
  archivedAt: schema.users.archivedAt,
  createdAt: schema.users.createdAt,
  updatedAt: schema.users.updatedAt,
  lastLoginAt: schema.users.lastLoginAt,
  firstName: schema.userProfiles.firstName,
  lastName: schema.userProfiles.lastName,
  phone: schema.userProfiles.phone,
  bio: schema.userProfiles.bio,
};
export const getSafeUser = async (db: AcademyDatabase, userId: string) => {
  const [user] = await db
    .select(safeUserColumns)
    .from(schema.users)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.users.id))
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!user) return null;
  const roles = await db
    .select({ code: schema.roles.code })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(and(eq(schema.userRoles.userId, userId), isNull(schema.roles.archivedAt)));
  const providers = await db
    .select({
      provider: schema.oauthAccounts.provider,
      providerEmail: schema.oauthAccounts.providerEmail,
      linkedAt: schema.oauthAccounts.linkedAt,
      lastLoginAt: schema.oauthAccounts.lastLoginAt,
    })
    .from(schema.oauthAccounts)
    .where(eq(schema.oauthAccounts.userId, userId));
  return {
    ...user,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
    roles: roles.map((x: any) => x.code),
    authenticationProviders: providers.length
      ? providers
      : [
          {
            provider: user.provider,
            providerEmail: user.email,
            linkedAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          },
        ],
  };
};
export const updateSafeProfile = async (
  db: AcademyDatabase,
  input: {
    actorId: string;
    userId: string;
    fullName?: string;
    phone?: string;
    bio?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
  },
) =>
  db.transaction(async (tx: any) => {
    const profile = await tx.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.userId, input.userId),
    });
    if (!profile) throw new Error('USER_NOT_FOUND');
    const names = input.fullName?.trim().split(/\s+/);
    const values = {
      firstName: names?.[0] ?? profile.firstName,
      lastName: names?.slice(1).join(' ') || (names ? '' : profile.lastName),
      phone: input.phone ?? profile.phone,
      bio: input.bio ?? profile.bio,
      updatedAt: new Date(),
    };
    await tx
      .update(schema.userProfiles)
      .set(values)
      .where(eq(schema.userProfiles.userId, input.userId));
    await tx.insert(schema.activityLogs).values({
      actorId: input.actorId,
      action: input.action,
      entityType: 'user',
      entityId: input.userId,
      before: {
        fullName: `${profile.firstName} ${profile.lastName}`,
        phone: profile.phone,
        bio: profile.bio,
      },
      after: {
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        phone: values.phone,
        bio: values.bio,
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return getSafeUser(db, input.userId);
  });
export const getUserPreferences = async (db: AcademyDatabase, userId: string) => {
  const existing = await db.query.userNotificationPreferences.findFirst({
    where: eq(schema.userNotificationPreferences.userId, userId),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(schema.userNotificationPreferences)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  return (
    created ??
    db.query.userNotificationPreferences.findFirst({
      where: eq(schema.userNotificationPreferences.userId, userId),
    })
  );
};
export type PreferenceUpdate = Partial<
  Pick<
    typeof schema.userNotificationPreferences.$inferInsert,
    | 'emailLearning'
    | 'emailPayments'
    | 'emailCertificates'
    | 'inAppLearning'
    | 'inAppPayments'
    | 'inAppCertificates'
  >
>;
export const updateNotificationPreferences = async (
  db: AcademyDatabase,
  actorId: string,
  values: PreferenceUpdate,
) =>
  db.transaction(async (tx: any) => {
    const before = await getUserPreferences(tx as AcademyDatabase, actorId);
    await tx
      .insert(schema.userNotificationPreferences)
      .values({ userId: actorId, ...values })
      .onConflictDoUpdate({
        target: schema.userNotificationPreferences.userId,
        set: { ...values, emailSecurity: true, updatedAt: new Date() },
      });
    await tx.insert(schema.activityLogs).values({
      actorId,
      action: 'user.notification_preferences.updated',
      entityType: 'user',
      entityId: actorId,
      before: before as Record<string, unknown>,
      after: values,
    });
    return getUserPreferences(db, actorId);
  });
export const updateUserPreferences = updateNotificationPreferences;
export const listActiveSessions = async (db: AcademyDatabase, userId: string) =>
  db
    .select({
      id: schema.refreshSessions.id,
      ipAddress: schema.refreshSessions.ipAddress,
      userAgent: schema.refreshSessions.userAgent,
      createdAt: schema.refreshSessions.createdAt,
      lastUsedAt: schema.refreshSessions.lastUsedAt,
      expiresAt: schema.refreshSessions.expiresAt,
    })
    .from(schema.refreshSessions)
    .where(
      and(
        eq(schema.refreshSessions.userId, userId),
        isNull(schema.refreshSessions.revokedAt),
        gt(schema.refreshSessions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(schema.refreshSessions.lastUsedAt));
export const revokeOwnedSession = async (
  db: AcademyDatabase,
  input: { actorId: string; userId: string; sessionId: string; admin: boolean },
) =>
  db.transaction(async (tx: any) => {
    const session = await tx.query.refreshSessions.findFirst({
      where: and(
        eq(schema.refreshSessions.id, input.sessionId),
        eq(schema.refreshSessions.userId, input.userId),
      ),
    });
    if (!session) return false;
    await tx
      .update(schema.refreshSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshSessions.id, input.sessionId));
    await tx.insert(schema.activityLogs).values({
      actorId: input.actorId,
      action: input.admin ? 'admin.sessions.revoked' : 'user.sessions.revoked',
      entityType: 'refresh_session',
      entityId: input.sessionId,
      before: { userId: input.userId, revokedAt: null },
      after: { userId: input.userId, revokedAt: new Date() },
    });
    return true;
  });
export const revokeSessionsExcept = async (
  db: AcademyDatabase,
  input: { actorId: string; userId: string; keepSessionId?: string; admin: boolean },
) =>
  db.transaction(async (tx: any) => {
    const conditions = [
      eq(schema.refreshSessions.userId, input.userId),
      isNull(schema.refreshSessions.revokedAt),
      input.keepSessionId ? ne(schema.refreshSessions.id, input.keepSessionId) : undefined,
    ].filter(Boolean);
    const revoked = await tx
      .update(schema.refreshSessions)
      .set({ revokedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: schema.refreshSessions.id });
    await tx.insert(schema.activityLogs).values({
      actorId: input.actorId,
      action: input.admin ? 'admin.user_sessions.revoked_all' : 'user.sessions.revoked_all',
      entityType: 'user',
      entityId: input.userId,
      after: { count: revoked.length, preservedCurrent: Boolean(input.keepSessionId) },
    });
    return revoked.length;
  });
export const listManagedUsers = async (
  db: AcademyDatabase,
  input: {
    search?: string;
    status?: string;
    role?: string;
    provider?: string;
    emailVerified?: boolean;
    includeArchived: boolean;
    limit: number;
    offset: number;
  },
) => {
  const conditions = [
    !input.includeArchived ? isNull(schema.users.archivedAt) : undefined,
    input.status
      ? eq(schema.users.status, input.status as (typeof schema.users.status.enumValues)[number])
      : undefined,
    input.provider ? eq(schema.users.provider, input.provider as 'LOCAL' | 'GOOGLE') : undefined,
    input.emailVerified === undefined
      ? undefined
      : eq(schema.users.emailVerified, input.emailVerified),
    input.search
      ? or(
          ilike(schema.users.emailNormalized, `%${input.search.trim().toLowerCase()}%`),
          ilike(schema.userProfiles.firstName, `%${input.search.trim()}%`),
          ilike(schema.userProfiles.lastName, `%${input.search.trim()}%`),
          ilike(schema.userProfiles.phone, `%${input.search.trim()}%`),
        )
      : undefined,
    input.role ? eq(schema.roles.code, input.role) : undefined,
  ].filter(Boolean);
  const base = db
    .selectDistinct(safeUserColumns)
    .from(schema.users)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.users.id))
    .leftJoin(schema.userRoles, eq(schema.userRoles.userId, schema.users.id))
    .leftJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
    .where(and(...conditions))
    .orderBy(desc(schema.users.createdAt), desc(schema.users.id))
    .limit(input.limit)
    .offset(input.offset);
  const items = await base;
  const [{ total = 0 } = {}] = await db
    .select({ total: count(sql`distinct ${schema.users.id}`) })
    .from(schema.users)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.users.id))
    .leftJoin(schema.userRoles, eq(schema.userRoles.userId, schema.users.id))
    .leftJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
    .where(and(...conditions));
  const userIds = items.map((user: any) => user.id);
  if (!userIds.length) return { items: [], total: Number(total) };
  const [roleRows, providerRows] = await Promise.all([
    db
      .select({ userId: schema.userRoles.userId, code: schema.roles.code })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(and(inArray(schema.userRoles.userId, userIds), isNull(schema.roles.archivedAt))),
    db
      .select({
        userId: schema.oauthAccounts.userId,
        provider: schema.oauthAccounts.provider,
        providerEmail: schema.oauthAccounts.providerEmail,
        linkedAt: schema.oauthAccounts.linkedAt,
        lastLoginAt: schema.oauthAccounts.lastLoginAt,
      })
      .from(schema.oauthAccounts)
      .where(inArray(schema.oauthAccounts.userId, userIds)),
  ]);
  const enriched = items.map((user: any) => ({
    ...user,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
    roles: roleRows.filter((role: any) => role.userId === user.id).map((role: any) => role.code),
    authenticationProviders: providerRows.filter((provider: any) => provider.userId === user.id),
  }));
  return { items: enriched, total: Number(total) };
};
export const getUserRecordSummary = async (db: AcademyDatabase, userId: string) => {
  const [
    [{ enrollmentCount = 0, activeEnrollmentCount = 0, completedEnrollmentCount = 0 } = {}],
    [{ paymentAttemptCount = 0 } = {}],
    [{ certificateCount = 0 } = {}],
    sessions,
  ] = await Promise.all([
    db
      .select({
        enrollmentCount: count(sql`*`),
        activeEnrollmentCount: count(
          sql`case when ${schema.enrollments.status} in ('ENROLLED', 'IN_PROGRESS') then 1 end`,
        ),
        completedEnrollmentCount: count(
          sql`case when ${schema.enrollments.status} = 'COMPLETED' then 1 end`,
        ),
      })
      .from(schema.enrollments)
      .where(eq(schema.enrollments.studentId, userId)),
    db
      .select({ paymentAttemptCount: count(sql`*`) })
      .from(schema.payments)
      .innerJoin(schema.enrollments, eq(schema.payments.enrollmentId, schema.enrollments.id))
      .where(eq(schema.enrollments.studentId, userId)),
    db
      .select({ certificateCount: count(sql`*`) })
      .from(schema.certificates)
      .innerJoin(schema.enrollments, eq(schema.certificates.enrollmentId, schema.enrollments.id))
      .where(eq(schema.enrollments.studentId, userId)),
    db.query.refreshSessions.findMany({
      where: eq(schema.refreshSessions.userId, userId),
      orderBy: [desc(schema.refreshSessions.createdAt)],
    }),
  ]);
  return {
    enrollmentCount: Number(enrollmentCount),
    activeEnrollmentCount: Number(activeEnrollmentCount),
    completedEnrollmentCount: Number(completedEnrollmentCount),
    paymentAttemptCount: Number(paymentAttemptCount),
    certificateCount: Number(certificateCount),
    activeSessionCount: sessions.length,
  };
};
export const transitionUserStatus = async (
  db: AcademyDatabase,
  input: {
    actorId: string;
    userId: string;
    target: ManagedUserStatus;
    reason?: string;
    action: string;
  },
) =>
  db.transaction(async (tx: any) => {
    const user = await tx.query.users.findFirst({ where: eq(schema.users.id, input.userId) });
    if (!user) throw new Error('USER_NOT_FOUND');
    if (input.actorId === input.userId) throw new Error('CANNOT_MODIFY_OWN_STATUS');
    const current = user.status === 'PENDING' ? 'PENDING_VERIFICATION' : user.status;
    const allowed: Record<string, ManagedUserStatus[]> = {
      PENDING_VERIFICATION: ['ACTIVE'],
      ACTIVE: ['SUSPENDED', 'ARCHIVED'],
      SUSPENDED: ['ACTIVE', 'ARCHIVED'],
      ARCHIVED: ['ACTIVE'],
    };
    if (!allowed[current]?.includes(input.target)) throw new Error('INVALID_STATUS_TRANSITION');
    if ((input.target === 'SUSPENDED' || input.target === 'ARCHIVED') && !input.reason?.trim())
      throw new Error('REASON_REQUIRED');
    const adminRole = await tx.query.roles.findFirst({
      where: eq(schema.roles.code, 'ADMINISTRATOR'),
    });
    if (adminRole && (input.target === 'SUSPENDED' || input.target === 'ARCHIVED')) {
      const targetAdmin = await tx.query.userRoles.findFirst({
        where: and(
          eq(schema.userRoles.userId, input.userId),
          eq(schema.userRoles.roleId, adminRole.id),
        ),
      });
      if (targetAdmin) {
        const [{ administrators = 0 } = {}] = await tx
          .select({ administrators: count() })
          .from(schema.userRoles)
          .innerJoin(
            schema.users,
            and(
              eq(schema.users.id, schema.userRoles.userId),
              eq(schema.users.status, 'ACTIVE'),
              isNull(schema.users.archivedAt),
            ),
          )
          .where(eq(schema.userRoles.roleId, adminRole.id));
        if (Number(administrators) <= 1) throw new Error('LAST_ADMINISTRATOR');
      }
    }
    const archivedAt = input.target === 'ARCHIVED' ? new Date() : null;
    await tx
      .update(schema.users)
      .set({ status: input.target, archivedAt, updatedAt: new Date() })
      .where(eq(schema.users.id, input.userId));
    if (input.target === 'SUSPENDED' || input.target === 'ARCHIVED')
      await tx
        .update(schema.refreshSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(schema.refreshSessions.userId, input.userId),
            isNull(schema.refreshSessions.revokedAt),
          ),
        );
    await tx.insert(schema.activityLogs).values({
      actorId: input.actorId,
      action: input.action,
      entityType: 'user',
      entityId: input.userId,
      before: { status: current },
      after: { status: input.target, reason: input.reason },
    });
    return input.target;
  });
export const listUserActivity = async (
  db: AcademyDatabase,
  input: { userId: string; action?: string; limit: number; offset: number },
) =>
  db
    .select({
      id: schema.activityLogs.id,
      actorId: schema.activityLogs.actorId,
      action: schema.activityLogs.action,
      entityType: schema.activityLogs.entityType,
      entityId: schema.activityLogs.entityId,
      before: schema.activityLogs.before,
      after: schema.activityLogs.after,
      createdAt: schema.activityLogs.createdAt,
    })
    .from(schema.activityLogs)
    .where(
      and(
        or(
          eq(schema.activityLogs.actorId, input.userId),
          eq(schema.activityLogs.entityId, input.userId),
        ),
        input.action ? eq(schema.activityLogs.action, input.action) : undefined,
      ),
    )
    .orderBy(desc(schema.activityLogs.createdAt), desc(schema.activityLogs.id))
    .limit(input.limit)
    .offset(input.offset);

export const permanentlyDeleteUser = async (
  db: AcademyDatabase,
  input: {
    actorId: string;
    userId: string;
    reason?: string;
    action?: string;
    isSelf?: boolean;
  },
) =>
  db.transaction(async (tx: any) => {
    const user = await tx.query.users.findFirst({
      where: eq(schema.users.id, input.userId),
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    if (!input.isSelf) {
      const adminRole = await tx.query.roles.findFirst({
        where: eq(schema.roles.code, 'ADMINISTRATOR'),
      });
      if (adminRole) {
        const targetAdmin = await tx.query.userRoles.findFirst({
          where: and(
            eq(schema.userRoles.userId, input.userId),
            eq(schema.userRoles.roleId, adminRole.id),
          ),
        });
        if (targetAdmin) {
          const [{ administrators = 0 } = {}] = await tx
            .select({ administrators: count() })
            .from(schema.userRoles)
            .innerJoin(
              schema.users,
              and(
                eq(schema.users.id, schema.userRoles.userId),
                eq(schema.users.status, 'ACTIVE'),
                isNull(schema.users.archivedAt),
              ),
            )
            .where(eq(schema.userRoles.roleId, adminRole.id));
          if (Number(administrators) <= 1) throw new Error('LAST_ADMINISTRATOR');
        }
      }
    }

    const userEnrollments = await tx
      .select({ id: schema.enrollments.id })
      .from(schema.enrollments)
      .where(eq(schema.enrollments.studentId, input.userId));

    const enrollmentIds = userEnrollments.map((e: any) => e.id);

    if (enrollmentIds.length > 0) {
      for (const eId of enrollmentIds) {
        await tx
          .update(schema.payments)
          .set({ enrollmentId: null })
          .where(eq(schema.payments.enrollmentId, eId));

        try {
          await tx.delete(schema.lessonProgress).where(eq(schema.lessonProgress.enrollmentId, eId));
        } catch {}

        try {
          await tx.delete(schema.certificates).where(eq(schema.certificates.enrollmentId, eId));
        } catch {}
      }
    }

    try {
      await tx
        .update(schema.certificates)
        .set({ generatedBy: null })
        .where(eq(schema.certificates.generatedBy, input.userId));
    } catch {}

    await tx
      .update(schema.payments)
      .set({ reviewerId: null })
      .where(eq(schema.payments.reviewerId, input.userId));

    await tx.delete(schema.enrollments).where(eq(schema.enrollments.studentId, input.userId));

    try {
      await tx.delete(schema.userProfiles).where(eq(schema.userProfiles.userId, input.userId));
    } catch {}

    try {
      await tx.delete(schema.userRoles).where(eq(schema.userRoles.userId, input.userId));
    } catch {}

    try {
      await tx
        .delete(schema.refreshSessions)
        .where(eq(schema.refreshSessions.userId, input.userId));
    } catch {}

    try {
      await tx.delete(schema.oauthAccounts).where(eq(schema.oauthAccounts.userId, input.userId));
    } catch {}

    try {
      await tx
        .delete(schema.accountLinkTokens)
        .where(eq(schema.accountLinkTokens.userId, input.userId));
    } catch {}

    try {
      await tx
        .delete(schema.userNotificationPreferences)
        .where(eq(schema.userNotificationPreferences.userId, input.userId));
    } catch {}

    try {
      await tx
        .update(schema.activityLogs)
        .set({ actorId: null })
        .where(eq(schema.activityLogs.actorId, input.userId));
    } catch {}

    await tx.insert(schema.activityLogs).values({
      actorId: input.actorId === input.userId ? null : input.actorId,
      action:
        input.action ??
        (input.isSelf ? 'user.self_permanently_deleted' : 'admin.user.permanently_deleted'),
      entityType: 'user',
      entityId: input.userId,
      before: { email: user.email, status: user.status },
      after: { deleted: true, reason: input.reason },
    });

    await tx.delete(schema.users).where(eq(schema.users.id, input.userId));

    return true;
  });

export const updateUserStatus = transitionUserStatus;
