import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import type Database from 'better-sqlite3';
import { schema } from './schema/index.ts';
import type { AcademyDatabase } from './queries.ts';

if (!(SQLiteTransaction.prototype as any).execute) {
  (SQLiteTransaction.prototype as any).execute = function (query: any) {
    try {
      return this.all(query);
    } catch {
      return this.run(query);
    }
  };
}

export const createDatabaseClient = (client: Database.Database): AcademyDatabase => {
  try {
    client.pragma('journal_mode = WAL');
    client.pragma('busy_timeout = 5000');
    client.pragma('synchronous = NORMAL');
  } catch {}

  const sanitizeArg = (arg: any): any => {
    if (arg instanceof Date) {
      return arg.getTime();
    }
    if (Array.isArray(arg)) {
      return arg.map(sanitizeArg);
    }
    return arg;
  };

  const sanitizeQuery = (source: string): string => {
    return source
      .replace(/\s+FOR\s+UPDATE(\s+SKIP\s+LOCKED)?|\s+FOR\s+SHARE/gi, '')
      .replace(/\S+\s+@@\s+websearch_to_tsquery\([^)]+\)/gi, '1=0')
      .replace(/\bILIKE\b/gi, 'LIKE')
      .replace(/\bNOW\(\)/gi, "datetime('now')");
  };

  const originalPrepare = client.prepare.bind(client);
  client.prepare = function (source: string, ...prepArgs: any[]) {
    const cleaned = sanitizeQuery(source);
    const stmt = (originalPrepare as any)(cleaned, ...prepArgs);
    const origAll = stmt.all.bind(stmt);
    const origRun = stmt.run.bind(stmt);
    const origGet = stmt.get.bind(stmt);
    stmt.all = (...args: any[]) => origAll(...args.map(sanitizeArg));
    stmt.run = (...args: any[]) => origRun(...args.map(sanitizeArg));
    stmt.get = (...args: any[]) => origGet(...args.map(sanitizeArg));
    return stmt;
  };

  const db = drizzle(client, { schema }) as any;
  if (!db.execute) {
    db.execute = (query: any) => {
      try {
        return db.all(query);
      } catch {
        return db.run(query);
      }
    };
  }
  db.transaction = async (cb: any) => {
    try {
      client.exec('BEGIN IMMEDIATE');
      const result = await cb(db);
      client.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        client.exec('ROLLBACK');
      } catch {}
      throw error;
    }
  };
  return db as AcademyDatabase;
};

export const checkDatabaseConnection = async (database: AcademyDatabase): Promise<void> => {
  if (database.execute) {
    await database.execute(sql`select 1`);
  } else {
    await database.run(sql`select 1`);
  }
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
  provider: 'LOCAL' | 'GOOGLE' | 'TELEGRAM';
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
    roles: assigned.map((item: any) => item.code),
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
export const findAuthUserByTelegramId = async (database: AcademyDatabase, telegramId: string) => {
  const account = await database.query.oauthAccounts.findFirst({
    where: and(
      eq(schema.oauthAccounts.provider, 'TELEGRAM'),
      eq(schema.oauthAccounts.providerAccountId, telegramId),
    ),
  });
  if (!account) return null;
  return findAuthUserById(database, account.userId);
};
export const linkTelegramAccount = async (
  database: AcademyDatabase,
  input: {
    userId: string;
    telegramId: string;
    telegramUsername?: string;
  },
) => {
  const existing = await database.query.oauthAccounts.findFirst({
    where: and(
      eq(schema.oauthAccounts.provider, 'TELEGRAM'),
      eq(schema.oauthAccounts.providerAccountId, input.telegramId),
    ),
  });
  if (existing) {
    if (existing.userId !== input.userId) {
      throw new Error('TELEGRAM_ID_ALREADY_LINKED_TO_OTHER_USER');
    }
    await database
      .update(schema.oauthAccounts)
      .set({
        providerEmail: input.telegramUsername ?? existing.providerEmail,
        lastLoginAt: new Date(),
      })
      .where(eq(schema.oauthAccounts.id, existing.id));
    return existing;
  }
  const userTelegramAccount = await database.query.oauthAccounts.findFirst({
    where: and(
      eq(schema.oauthAccounts.userId, input.userId),
      eq(schema.oauthAccounts.provider, 'TELEGRAM'),
    ),
  });
  if (userTelegramAccount) {
    throw new Error('USER_ALREADY_HAS_LINKED_TELEGRAM_ACCOUNT');
  }
  const [linked] = await database
    .insert(schema.oauthAccounts)
    .values({
      userId: input.userId,
      provider: 'TELEGRAM',
      providerAccountId: input.telegramId,
      providerEmail: input.telegramUsername,
      linkedAt: new Date(),
      lastLoginAt: new Date(),
    })
    .returning();
  return linked;
};

export const unlinkTelegramAccount = async (database: AcademyDatabase, userId: string) => {
  const result = await database
    .delete(schema.oauthAccounts)
    .where(
      and(eq(schema.oauthAccounts.userId, userId), eq(schema.oauthAccounts.provider, 'TELEGRAM')),
    )
    .returning();
  return result.length > 0;
};
export const createAccountLinkToken = async (
  database: AcademyDatabase,
  input: {
    id?: string;
    userId: string;
    purpose: string;
    tokenHash: string;
    expiresAt: Date;
  },
) => {
  const [record] = await database
    .insert(schema.accountLinkTokens)
    .values({
      id: input.id ?? crypto.randomUUID(),
      userId: input.userId,
      purpose: input.purpose,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    })
    .returning();
  return record;
};
export const consumeAccountLinkToken = async (
  database: AcademyDatabase,
  input: {
    tokenHash: string;
    purpose: string;
  },
) =>
  database.transaction(async (tx: any) => {
    const tokenRecord = await tx.query.accountLinkTokens.findFirst({
      where: and(
        eq(schema.accountLinkTokens.tokenHash, input.tokenHash),
        eq(schema.accountLinkTokens.purpose, input.purpose),
      ),
    });
    if (!tokenRecord) return { valid: false, reason: 'TOKEN_NOT_FOUND' };
    if (tokenRecord.usedAt) return { valid: false, reason: 'TOKEN_ALREADY_USED' };
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }
    await tx
      .update(schema.accountLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.accountLinkTokens.id, tokenRecord.id));
    return { valid: true, userId: tokenRecord.userId, tokenRecord };
  });
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
  database.transaction(async (tx: any) => {
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
      const existingOAuth = await tx.query.oauthAccounts.findFirst({
        where: and(
          eq(schema.oauthAccounts.provider, 'GOOGLE'),
          eq(schema.oauthAccounts.providerAccountId, input.googleId),
        ),
      });
      if (existingOAuth) {
        await tx
          .update(schema.oauthAccounts)
          .set({ providerEmail: input.email, lastLoginAt: new Date() })
          .where(eq(schema.oauthAccounts.id, existingOAuth.id));
      } else {
        await tx.insert(schema.oauthAccounts).values({
          userId: googleMatch.id,
          provider: 'GOOGLE',
          providerAccountId: input.googleId,
          providerEmail: input.email,
          lastLoginAt: new Date(),
        });
      }
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
      const existingOAuth = await tx.query.oauthAccounts.findFirst({
        where: and(
          eq(schema.oauthAccounts.provider, 'GOOGLE'),
          eq(schema.oauthAccounts.providerAccountId, input.googleId),
        ),
      });
      if (existingOAuth) {
        await tx
          .update(schema.oauthAccounts)
          .set({ providerEmail: input.email, lastLoginAt: new Date() })
          .where(eq(schema.oauthAccounts.id, existingOAuth.id));
      } else {
        await tx.insert(schema.oauthAccounts).values({
          userId: emailMatch.id,
          provider: 'GOOGLE',
          providerAccountId: input.googleId,
          providerEmail: input.email,
          lastLoginAt: new Date(),
        });
      }
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
  database.transaction(async (tx: any) => {
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
  database.transaction(async (tx: any) => {
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
  database.transaction(async (tx: any) => {
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
  database.transaction(async (tx: any) => {
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

export const linkTelegramAccountToUser = async (
  database: AcademyDatabase,
  input: {
    userId: string;
    telegramUserId: string;
    telegramUsername?: string;
  },
) => {
  return database.transaction(async (tx) => {
    // Check if telegramUserId is already linked to another user
    const existingProvider = await tx.query.oauthAccounts.findFirst({
      where: and(
        eq(schema.oauthAccounts.provider, 'TELEGRAM'),
        eq(schema.oauthAccounts.providerAccountId, input.telegramUserId),
      ),
    });
    if (existingProvider && existingProvider.userId !== input.userId) {
      throw new Error('TELEGRAM_ID_ALREADY_LINKED_TO_OTHER');
    }

    // Check if user already has a linked Telegram account
    const existingUserTg = await tx.query.oauthAccounts.findFirst({
      where: and(
        eq(schema.oauthAccounts.provider, 'TELEGRAM'),
        eq(schema.oauthAccounts.userId, input.userId),
      ),
    });
    if (existingUserTg) {
      throw new Error('USER_ALREADY_HAS_TELEGRAM');
    }

    const [account] = await tx
      .insert(schema.oauthAccounts)
      .values({
        userId: input.userId,
        provider: 'TELEGRAM',
        providerAccountId: input.telegramUserId,
        providerEmail: input.telegramUsername ?? null,
        linkedAt: new Date(),
      })
      .returning();

    await tx
      .delete(schema.telegramOnboardingStates)
      .where(eq(schema.telegramOnboardingStates.telegramUserId, input.telegramUserId));

    return account;
  });
};

export const getTelegramOnboardingState = async (
  database: AcademyDatabase,
  telegramUserId: string,
) => {
  const state = await database.query.telegramOnboardingStates.findFirst({
    where: eq(schema.telegramOnboardingStates.telegramUserId, telegramUserId),
  });
  if (!state) return null;
  if (new Date() > new Date(state.expiresAt)) {
    await database
      .delete(schema.telegramOnboardingStates)
      .where(eq(schema.telegramOnboardingStates.telegramUserId, telegramUserId));
    return null;
  }
  return state;
};

export const upsertTelegramOnboardingState = async (
  database: AcademyDatabase,
  input: {
    telegramUserId: string;
    step:
      | 'AWAITING_EMAIL'
      | 'AWAITING_OTP'
      | 'EMAIL_VERIFIED'
      | 'AWAITING_PASSWORD'
      | 'AWAITING_PASSWORD_CONFIRMATION'
      | 'PAUSED'
      | 'COMPLETED'
      | 'CANCELLED';
    email?: string | null;
    otpHash?: string | null;
    otpExpiresAt?: Date | null;
    otpAttempts?: number;
    resendCount?: number;
    lastResendAt?: Date | null;
    emailVerifiedAt?: Date | null;
    pausedAt?: Date | null;
    expiresAt: Date;
  },
) => {
  const existing = await database.query.telegramOnboardingStates.findFirst({
    where: eq(schema.telegramOnboardingStates.telegramUserId, input.telegramUserId),
  });

  const values = {
    telegramUserId: input.telegramUserId,
    step: input.step,
    email: input.email ?? null,
    otpHash: input.otpHash ?? null,
    otpExpiresAt: input.otpExpiresAt ?? null,
    otpAttempts: input.otpAttempts ?? 0,
    resendCount: input.resendCount ?? 0,
    lastResendAt: input.lastResendAt ?? null,
    emailVerifiedAt: input.emailVerifiedAt ?? null,
    pausedAt: input.pausedAt ?? null,
    expiresAt: input.expiresAt,
    updatedAt: new Date(),
  };

  if (existing) {
    await database
      .update(schema.telegramOnboardingStates)
      .set(values)
      .where(eq(schema.telegramOnboardingStates.telegramUserId, input.telegramUserId));
  } else {
    await database.insert(schema.telegramOnboardingStates).values({
      ...values,
      createdAt: new Date(),
    });
  }
  return getTelegramOnboardingState(database, input.telegramUserId);
};

export const deleteTelegramOnboardingState = async (
  database: AcademyDatabase,
  telegramUserId: string,
) => {
  await database
    .delete(schema.telegramOnboardingStates)
    .where(eq(schema.telegramOnboardingStates.telegramUserId, telegramUserId));
};

export const createTelegramStudentUser = async (
  database: AcademyDatabase,
  input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    telegramUserId: string;
    telegramUsername?: string;
  },
) => {
  // Recheck email uniqueness for concurrency race safety (TG5.18)
  const emailNormalized = input.email.trim().toLowerCase();
  const existingEmail = await database.query.users.findFirst({
    where: eq(schema.users.emailNormalized, emailNormalized),
  });
  if (existingEmail) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  // Recheck Telegram ID uniqueness (TG5.25)
  const existingTelegram = await database.query.oauthAccounts.findFirst({
    where: and(
      eq(schema.oauthAccounts.provider, 'TELEGRAM'),
      eq(schema.oauthAccounts.providerAccountId, input.telegramUserId),
    ),
  });
  if (existingTelegram) {
    throw new Error('TELEGRAM_ID_ALREADY_LINKED');
  }

  // Create LMS user row with verified status
  const [user] = await database
    .insert(schema.users)
    .values({
      email: input.email,
      emailNormalized,
      passwordHash: input.passwordHash,
      provider: 'TELEGRAM',
      emailVerified: true,
      status: 'ACTIVE',
    })
    .returning();

  if (!user) throw new Error('User could not be created');

  // Create profile
  await database.insert(schema.userProfiles).values({
    userId: user.id,
    firstName: input.firstName || 'Student',
    lastName: input.lastName || '',
  });

  // Assign Student role
  let role = await database.query.roles.findFirst({
    where: eq(schema.roles.code, 'STUDENT'),
  });
  if (!role) {
    [role] = await database
      .insert(schema.roles)
      .values({ code: 'STUDENT', name: 'Student' })
      .returning();
  }
  if (!role) throw new Error('Student role could not be assigned');
  await database.insert(schema.userRoles).values({
    userId: user.id,
    roleId: role.id,
  });

  // Create Telegram identity mapping in oauth_accounts
  await database.insert(schema.oauthAccounts).values({
    userId: user.id,
    provider: 'TELEGRAM',
    providerAccountId: input.telegramUserId,
    providerEmail: input.telegramUsername ?? null,
    linkedAt: new Date(),
    lastLoginAt: new Date(),
  });

  // Clean up onboarding state
  await deleteTelegramOnboardingState(database, input.telegramUserId);

  return hydrateAuthUser(database, user);
};
