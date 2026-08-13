import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { schema } from './schema/index.ts';
import type { AcademyDatabase } from './queries.ts';

export const createDatabaseClient = (pool: Pool): AcademyDatabase =>
  drizzle({ client: pool, schema });
export const checkDatabaseConnection = async (database: AcademyDatabase): Promise<void> => {
  await database.execute(sql`select 1`);
};

export interface ActivityLogRecord {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
export const insertActivityLog = async (
  database: AcademyDatabase,
  record: ActivityLogRecord,
): Promise<void> => {
  await database.insert(schema.activityLogs).values(record);
};

export interface BackgroundJobRecord {
  jobType: string;
  payload: Record<string, unknown>;
  priority?: number;
  scheduledAt?: Date;
}
export const insertBackgroundJob = async (
  database: AcademyDatabase,
  record: BackgroundJobRecord,
): Promise<string> => {
  const [job] = await database
    .insert(schema.backgroundJobs)
    .values({ ...record, scheduledAt: record.scheduledAt ?? new Date() })
    .returning({ id: schema.backgroundJobs.id });
  if (!job) throw new Error('Job could not be created');
  return job.id;
};
export const updateBackgroundJobStatus = async (
  database: AcademyDatabase,
  id: string,
  status: 'PENDING' | 'COMPLETED' | 'FAILED',
): Promise<boolean> => {
  const rows = await database
    .update(schema.backgroundJobs)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.backgroundJobs.id, id))
    .returning({ id: schema.backgroundJobs.id });
  return rows.length === 1;
};

export type AuthUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'PENDING_VERIFICATION' | 'ARCHIVED';
  firstName: string;
  lastName: string;
  roles: string[];
  avatarUrl: string | null;
  provider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
};
const hydrateAuthUser = async (
  database: AcademyDatabase,
  user: typeof schema.users.$inferSelect,
): Promise<AuthUserRecord> => {
  const [profile, assigned] = await Promise.all([
    database.query.userProfiles.findFirst({ where: eq(schema.userProfiles.userId, user.id) }),
    database
      .select({ code: schema.roles.code })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, user.id)),
  ]);
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    status: user.status,
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    roles: assigned.map((item) => item.code),
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    emailVerified: user.emailVerified,
  };
};
export const findAuthUserByEmail = async (database: AcademyDatabase, email: string) => {
  const user = await database.query.users.findFirst({
    where: and(eq(schema.users.emailNormalized, email), isNull(schema.users.archivedAt)),
  });
  return user ? hydrateAuthUser(database, user) : null;
};
export const findAuthUserById = async (database: AcademyDatabase, id: string) => {
  const user = await database.query.users.findFirst({
    where: and(eq(schema.users.id, id), isNull(schema.users.archivedAt)),
  });
  return user ? hydrateAuthUser(database, user) : null;
};
export const findAuthUserByGoogleId = async (database: AcademyDatabase, googleId: string) => {
  const user = await database.query.users.findFirst({
    where: and(eq(schema.users.googleId, googleId), isNull(schema.users.archivedAt)),
  });
  return user ? hydrateAuthUser(database, user) : null;
};
export type GoogleUserUpsertEvent = 'GOOGLE_MATCH' | 'EMAIL_LINKED' | 'CREATED';
export const upsertGoogleUser = async (
  database: AcademyDatabase,
  input: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    passwordHash: string;
  },
): Promise<{ user: AuthUserRecord; event: GoogleUserUpsertEvent }> =>
  database.transaction(async (tx) => {
    const googleMatch = await tx.query.users.findFirst({
      where: eq(schema.users.googleId, input.googleId),
    });
    if (googleMatch) {
      await tx
        .update(schema.users)
        .set({
          avatarUrl: input.avatarUrl,
          emailVerified: true,
          status: 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, googleMatch.id));
      await tx
        .insert(schema.oauthAccounts)
        .values({
          userId: googleMatch.id,
          provider: 'GOOGLE',
          providerAccountId: input.googleId,
          providerEmail: input.email,
          lastLoginAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.oauthAccounts.provider, schema.oauthAccounts.providerAccountId],
          set: { providerEmail: input.email, lastLoginAt: new Date() },
        });
      return {
        user: await hydrateAuthUser(database, {
          ...googleMatch,
          avatarUrl: input.avatarUrl ?? null,
          emailVerified: true,
          status: 'ACTIVE',
        }),
        event: 'GOOGLE_MATCH',
      };
    }
    const emailMatch = await tx.query.users.findFirst({
      where: eq(schema.users.emailNormalized, input.email),
    });
    if (emailMatch) {
      await tx
        .update(schema.users)
        .set({
          googleId: input.googleId,
          avatarUrl: input.avatarUrl,
          provider: 'GOOGLE',
          emailVerified: true,
          status: 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, emailMatch.id));
      await tx
        .insert(schema.oauthAccounts)
        .values({
          userId: emailMatch.id,
          provider: 'GOOGLE',
          providerAccountId: input.googleId,
          providerEmail: input.email,
        })
        .onConflictDoUpdate({
          target: [schema.oauthAccounts.provider, schema.oauthAccounts.providerAccountId],
          set: { providerEmail: input.email, lastLoginAt: new Date() },
        });
      return {
        user: await hydrateAuthUser(database, {
          ...emailMatch,
          googleId: input.googleId,
          avatarUrl: input.avatarUrl ?? null,
          provider: 'GOOGLE',
          emailVerified: true,
          status: 'ACTIVE',
        }),
        event: 'EMAIL_LINKED',
      };
    }
    const [created] = await tx
      .insert(schema.users)
      .values({
        email: input.email,
        emailNormalized: input.email,
        passwordHash: input.passwordHash,
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
        provider: 'GOOGLE',
        emailVerified: true,
        status: 'ACTIVE',
      })
      .returning();
    if (!created) throw new Error('Google user could not be created');
    await tx
      .insert(schema.userProfiles)
      .values({ userId: created.id, firstName: input.firstName, lastName: input.lastName });
    await tx.insert(schema.oauthAccounts).values({
      userId: created.id,
      provider: 'GOOGLE',
      providerAccountId: input.googleId,
      providerEmail: input.email,
    });
    let role = await tx.query.roles.findFirst({ where: eq(schema.roles.code, 'STUDENT') });
    if (!role)
      [role] = await tx
        .insert(schema.roles)
        .values({ code: 'STUDENT', name: 'Student' })
        .returning();
    if (!role) throw new Error('Student role could not be assigned');
    await tx.insert(schema.userRoles).values({ userId: created.id, roleId: role.id });
    return { user: await hydrateAuthUser(database, created), event: 'CREATED' };
  });
export const createStudentUser = async (
  database: AcademyDatabase,
  input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    tokenHash: string;
    tokenExpiresAt: Date;
  },
) =>
  database.transaction(async (tx) => {
    const [user] = await tx
      .insert(schema.users)
      .values({
        email: input.email,
        emailNormalized: input.email,
        passwordHash: input.passwordHash,
      })
      .returning();
    if (!user) throw new Error('User could not be created');
    await tx
      .insert(schema.userProfiles)
      .values({ userId: user.id, firstName: input.firstName, lastName: input.lastName });
    let role = await tx.query.roles.findFirst({ where: eq(schema.roles.code, 'STUDENT') });
    if (!role)
      [role] = await tx
        .insert(schema.roles)
        .values({ code: 'STUDENT', name: 'Student' })
        .returning();
    if (!role) throw new Error('Student role could not be assigned');
    await tx.insert(schema.userRoles).values({ userId: user.id, roleId: role.id });
    await tx
      .insert(schema.emailVerificationTokens)
      .values({ userId: user.id, tokenHash: input.tokenHash, expiresAt: input.tokenExpiresAt });
    return hydrateAuthUser(database, user);
  });
export const createRefreshSession = async (
  database: AcademyDatabase,
  input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  },
) => {
  const [session] = await database
    .insert(schema.refreshSessions)
    .values(input)
    .returning({ id: schema.refreshSessions.id });
  if (!session) throw new Error('Session could not be created');
  return session.id;
};
export const rotateRefreshSession = async (
  database: AcademyDatabase,
  id: string,
  tokenHash: string,
  expiresAt: Date,
) => {
  const rows = await database
    .update(schema.refreshSessions)
    .set({ tokenHash, expiresAt, lastUsedAt: new Date() })
    .where(
      and(
        eq(schema.refreshSessions.id, id),
        isNull(schema.refreshSessions.revokedAt),
        gt(schema.refreshSessions.expiresAt, new Date()),
      ),
    )
    .returning({ id: schema.refreshSessions.id });
  return rows.length === 1;
};
export const revokeRefreshSession = async (database: AcademyDatabase, id: string) => {
  await database
    .update(schema.refreshSessions)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshSessions.id, id));
};
export const revokeUserSessions = async (database: AcademyDatabase, userId: string) => {
  await database
    .update(schema.refreshSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(schema.refreshSessions.userId, userId), isNull(schema.refreshSessions.revokedAt)),
    );
};
export const findRefreshSession = async (database: AcademyDatabase, id: string) =>
  database.query.refreshSessions.findFirst({
    where: and(
      eq(schema.refreshSessions.id, id),
      isNull(schema.refreshSessions.revokedAt),
      gt(schema.refreshSessions.expiresAt, new Date()),
    ),
  });
export const recordLoginAttempt = async (
  database: AcademyDatabase,
  input: typeof schema.loginAttempts.$inferInsert,
) => {
  await database.insert(schema.loginAttempts).values(input);
};
export const updateLastLogin = async (database: AcademyDatabase, userId: string) => {
  await database
    .update(schema.users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
};
export const createPasswordReset = async (
  database: AcademyDatabase,
  input: { userId: string; tokenHash: string; expiresAt: Date },
) =>
  database.transaction(async (tx) => {
    await tx
      .delete(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.userId, input.userId));
    await tx.insert(schema.passwordResetTokens).values(input);
  });
export const consumePasswordReset = async (
  database: AcademyDatabase,
  tokenHash: string,
  passwordHash: string,
) =>
  database.transaction(async (tx) => {
    const token = await tx.query.passwordResetTokens.findFirst({
      where: and(
        eq(schema.passwordResetTokens.tokenHash, tokenHash),
        gt(schema.passwordResetTokens.expiresAt, new Date()),
      ),
    });
    if (!token) return null;
    await tx
      .update(schema.users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, token.userId));
    await tx
      .delete(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.userId, token.userId));
    await tx
      .update(schema.refreshSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.refreshSessions.userId, token.userId),
          isNull(schema.refreshSessions.revokedAt),
        ),
      );
    return token.userId;
  });
export const consumeEmailVerification = async (database: AcademyDatabase, tokenHash: string) =>
  database.transaction(async (tx) => {
    const token = await tx.query.emailVerificationTokens.findFirst({
      where: and(
        eq(schema.emailVerificationTokens.tokenHash, tokenHash),
        gt(schema.emailVerificationTokens.expiresAt, new Date()),
      ),
    });
    if (!token) return false;
    await tx
      .update(schema.users)
      .set({ status: 'ACTIVE', emailVerified: true, updatedAt: new Date() })
      .where(eq(schema.users.id, token.userId));
    await tx
      .delete(schema.emailVerificationTokens)
      .where(eq(schema.emailVerificationTokens.userId, token.userId));
    return token.userId;
  });
export const changeUserPassword = async (
  database: AcademyDatabase,
  userId: string,
  passwordHash: string,
) => {
  await database
    .update(schema.users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  await revokeUserSessions(database, userId);
};
