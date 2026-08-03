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
    roles: roles.map((x) => x.code),
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
  db.transaction(async (tx) => {
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
export const updateUserPreferences = async (
  db: AcademyDatabase,
  actorId: string,
  values: PreferenceUpdate,
) =>
  db.transaction(async (tx) => {
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
  db.transaction(async (tx) => {
    const session = await tx.query.refreshSessions.findFirst({
      where: and(
        eq(schema.refreshSessions.id, input.sessionId),
        eq(schema.refreshSessions.userId, input.userId),
      ),
    });
    if (!session) throw new Error('SESSION_NOT_FOUND');
    if (session.revokedAt) throw new Error('SESSION_ALREADY_REVOKED');
    await tx
      .update(schema.refreshSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshSessions.id, session.id));
    await tx.insert(schema.activityLogs).values({
      actorId: input.actorId,
      action: input.admin ? 'admin.user_session.revoked' : 'user.session.revoked',
      entityType: 'refresh_session',
      entityId: session.id,
      after: { targetUserId: input.userId },
    });
    if (input.admin)
      await tx.insert(schema.notifications).values({
        userId: input.userId,
        channel: 'IN_APP',
        title: 'Session revoked',
        body: 'An administrator revoked one of your login sessions.',
      });
    return session.id;
  });
export const revokeSessionsExcept = async (
  db: AcademyDatabase,
  input: { actorId: string; userId: string; keepSessionId?: string; admin: boolean },
) =>
  db.transaction(async (tx) => {
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
    if (input.admin)
      await tx.insert(schema.notifications).values({
        userId: input.userId,
        channel: 'IN_APP',
        title: 'Sessions revoked',
        body: 'An administrator revoked your active login sessions.',
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
  const userIds = items.map((user) => user.id);
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
  const enriched = items.map((user) => ({
    ...user,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
    roles: roleRows.filter((role) => role.userId === user.id).map((role) => role.code),
    authenticationProviders: providerRows.filter((provider) => provider.userId === user.id),
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
        enrollmentCount: count(),
        activeEnrollmentCount: count(
          sql`case when ${schema.enrollments.status} = 'ACTIVE' then 1 end`,
        ),
        completedEnrollmentCount: count(
          sql`case when ${schema.enrollments.status} = 'COMPLETED' then 1 end`,
        ),
      })
      .from(schema.enrollments)
      .where(eq(schema.enrollments.studentId, userId)),
    db
      .select({ paymentAttemptCount: count() })
      .from(schema.payments)
      .innerJoin(schema.enrollments, eq(schema.payments.enrollmentId, schema.enrollments.id))
      .where(eq(schema.enrollments.studentId, userId)),
    db
      .select({ certificateCount: count() })
      .from(schema.certificates)
      .innerJoin(schema.enrollments, eq(schema.certificates.enrollmentId, schema.enrollments.id))
      .where(eq(schema.enrollments.studentId, userId)),
    listActiveSessions(db, userId),
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
  db.transaction(async (tx) => {
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
    await tx.insert(schema.notifications).values({
      userId: input.userId,
      channel: 'IN_APP',
      title: `Account ${input.target.toLowerCase()}`,
      body: `Your account status changed to ${input.target}.`,
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
