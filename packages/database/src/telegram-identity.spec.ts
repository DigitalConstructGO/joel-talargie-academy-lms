import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import {
  createDatabaseClient,
  findAuthUserById,
  findAuthUserByTelegramId,
  linkTelegramAccount,
  createAccountLinkToken,
  consumeAccountLinkToken,
  upsertGoogleUser,
} from './infrastructure.ts';
import { getSafeUser } from './users.ts';
import { schema } from './schema/index.ts';

describe('TG2 — Unified Identity Database Model & Telegram Integration', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof createDatabaseClient>;
  let testUserId: string;
  let secondUserId: string;

  beforeAll(async () => {
    sqlite = new Database(':memory:');

    // Create required schema tables in SQLite in-memory DB
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL,
        email_normalized TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        google_id TEXT UNIQUE,
        avatar_url TEXT,
        provider TEXT NOT NULL DEFAULT 'LOCAL',
        email_verified INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
        archived_at INTEGER,
        last_login_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
        updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );

      CREATE TABLE user_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        bio TEXT,
        created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
        updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );

      CREATE TABLE oauth_accounts (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        provider_email TEXT,
        linked_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
        last_login_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );

      CREATE UNIQUE INDEX oauth_accounts_provider_account_uq ON oauth_accounts (provider, provider_account_id);
      CREATE UNIQUE INDEX oauth_accounts_user_provider_uq ON oauth_accounts (user_id, provider);

      CREATE TABLE account_link_tokens (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        purpose TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );

      CREATE TABLE roles (
        id TEXT PRIMARY KEY NOT NULL,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_system INTEGER NOT NULL DEFAULT 0,
        archived_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
        updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );

      CREATE TABLE user_roles (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );

      CREATE TABLE categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image_key TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        archived_at INTEGER,
        parent_id TEXT REFERENCES categories(id),
        created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
        updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );

      CREATE TABLE courses (
        id TEXT PRIMARY KEY NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id),
        created_by TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        short_description TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        thumbnail_key TEXT,
        presenter_name TEXT NOT NULL DEFAULT 'Presenter',
        status TEXT NOT NULL DEFAULT 'DRAFT',
        visibility TEXT NOT NULL DEFAULT 'PRIVATE',
        access_type TEXT NOT NULL DEFAULT 'FREE',
        featured INTEGER NOT NULL DEFAULT 0,
        price TEXT NOT NULL DEFAULT '0',
        discount_price TEXT,
        currency TEXT NOT NULL DEFAULT 'ETB',
        difficulty TEXT NOT NULL DEFAULT 'ALL_LEVELS',
        estimated_duration_minutes INTEGER,
        certificate_enabled INTEGER NOT NULL DEFAULT 0,
        enrollment_open_at INTEGER,
        enrollment_close_at INTEGER,
        capacity INTEGER,
        published_at INTEGER,
        archived_at INTEGER,
        search_vector TEXT,
        created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
        updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );

      CREATE TABLE enrollments (
        id TEXT PRIMARY KEY NOT NULL,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
        last_lesson_id TEXT,
        status TEXT NOT NULL DEFAULT 'ENROLLED',
        price_at_enrollment TEXT NOT NULL DEFAULT '0',
        currency_at_enrollment TEXT NOT NULL DEFAULT 'ETB',
        discount_at_enrollment TEXT NOT NULL DEFAULT '0',
        progress_percentage INTEGER NOT NULL DEFAULT 0,
        enrolled_at INTEGER,
        started_at INTEGER,
        completed_at INTEGER,
        cancelled_at INTEGER,
        cancelled_by TEXT REFERENCES users(id),
        cancellation_reason TEXT,
        access_revoked_at INTEGER,
        access_revocation_reason TEXT,
        created_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
        updated_at INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
      );
    `);

    db = createDatabaseClient(sqlite);

    // Seed initial role STUDENT
    await db.insert(schema.roles).values({
      code: 'STUDENT',
      name: 'Student',
    });

    // Create primary test user
    const [u1] = await db
      .insert(schema.users)
      .values({
        email: 'student1@example.com',
        emailNormalized: 'student1@example.com',
        passwordHash: 'hashed_password_123',
        status: 'ACTIVE',
        emailVerified: true,
      })
      .returning();

    testUserId = u1.id;

    await db.insert(schema.userProfiles).values({
      userId: testUserId,
      firstName: 'Joel',
      lastName: 'Student',
    });

    // Create second test user
    const [u2] = await db
      .insert(schema.users)
      .values({
        email: 'student2@example.com',
        emailNormalized: 'student2@example.com',
        passwordHash: 'hashed_password_456',
        status: 'ACTIVE',
        emailVerified: true,
      })
      .returning();

    secondUserId = u2.id;

    await db.insert(schema.userProfiles).values({
      userId: secondUserId,
      firstName: 'Second',
      lastName: 'Student',
    });
  });

  afterAll(async () => {
    if (sqlite) {
      sqlite.close();
    }
  });

  it('TEST 1 — Existing user survives migration and retains authentication properties', async () => {
    const user = await findAuthUserById(db, testUserId);
    expect(user).not.toBeNull();
    expect(user?.email).toBe('student1@example.com');
    expect(user?.id).toBe(testUserId);
  });

  it('TEST 2 — Existing Google user resolves to canonical users.id without duplicate', async () => {
    const googleResult = await upsertGoogleUser(db, {
      googleId: 'google_123456789',
      email: 'student1@example.com',
      firstName: 'Joel',
      lastName: 'Student',
      passwordHash: 'random_hash',
    });

    expect(googleResult.event).toBe('EMAIL_LINKED');
    expect(googleResult.user.id).toBe(testUserId);

    const usersCount = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.emailNormalized, 'student1@example.com'));
    expect(usersCount.length).toBe(1);
  });

  it('TEST 3 — Telegram identity can link to canonical users.id', async () => {
    const linked = await linkTelegramAccount(db, {
      userId: testUserId,
      telegramId: '847362910',
      telegramUsername: 'joel_student_tg',
    });

    expect(linked.userId).toBe(testUserId);
    expect(linked.providerAccountId).toBe('847362910');

    const found = await findAuthUserByTelegramId(db, '847362910');
    expect(found).not.toBeNull();
    expect(found?.id).toBe(testUserId);
  });

  it('TEST 4 — Duplicate Telegram ID for a different user is rejected', async () => {
    await expect(
      linkTelegramAccount(db, {
        userId: secondUserId,
        telegramId: '847362910',
        telegramUsername: 'another_tg',
      }),
    ).rejects.toThrow('TELEGRAM_ID_ALREADY_LINKED_TO_OTHER_USER');
  });

  it('TEST 5 — Second Telegram ID for the same user is rejected in V1', async () => {
    await expect(
      linkTelegramAccount(db, {
        userId: testUserId,
        telegramId: '111222333',
        telegramUsername: 'joel_second_tg',
      }),
    ).rejects.toThrow('USER_ALREADY_HAS_LINKED_TELEGRAM_ACCOUNT');
  });

  it('TEST 6 — Google + Telegram identities are both allowed for the same user', async () => {
    const safeUser = await getSafeUser(db, testUserId);
    expect(safeUser).not.toBeNull();

    const providerTypes = safeUser?.authenticationProviders.map(
      (p: { provider: string }) => p.provider,
    );
    expect(providerTypes).toContain('GOOGLE');
    expect(providerTypes).toContain('TELEGRAM');
  });

  it('TEST 7 — Phone number remains optional', async () => {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.userId, testUserId),
    });
    expect(profile?.phone).toBeNull();

    const found = await findAuthUserByTelegramId(db, '847362910');
    expect(found).not.toBeNull();
  });

  it('TEST 8 — Telegram username is optional', async () => {
    const linked = await linkTelegramAccount(db, {
      userId: secondUserId,
      telegramId: '999000111',
    });

    expect(linked.userId).toBe(secondUserId);
    expect(linked.providerAccountId).toBe('999000111');
    expect(linked.providerEmail).toBeFalsy();
  });

  it('TEST 9 — Link token expiration model invalidates expired tokens', async () => {
    const expiredDate = new Date(Date.now() - 10000);
    await createAccountLinkToken(db, {
      userId: testUserId,
      purpose: 'TELEGRAM_LINK',
      tokenHash: 'expired_hash_123',
      expiresAt: expiredDate,
    });

    const result = await consumeAccountLinkToken(db, {
      tokenHash: 'expired_hash_123',
      purpose: 'TELEGRAM_LINK',
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('TOKEN_EXPIRED');
  });

  it('TEST 10 — Link token single use model prevents token reuse', async () => {
    const validDate = new Date(Date.now() + 600000);
    await createAccountLinkToken(db, {
      userId: testUserId,
      purpose: 'TELEGRAM_LINK',
      tokenHash: 'single_use_hash_456',
      expiresAt: validDate,
    });

    const firstUse = await consumeAccountLinkToken(db, {
      tokenHash: 'single_use_hash_456',
      purpose: 'TELEGRAM_LINK',
    });
    expect(firstUse.valid).toBe(true);
    expect(firstUse.userId).toBe(testUserId);

    const secondUse = await consumeAccountLinkToken(db, {
      tokenHash: 'single_use_hash_456',
      purpose: 'TELEGRAM_LINK',
    });
    expect(secondUse.valid).toBe(false);
    expect(secondUse.reason).toBe('TOKEN_ALREADY_USED');
  });

  it('TEST 11 — Token hash is not exposed in public user object', async () => {
    const safeUser = await getSafeUser(db, testUserId);
    expect(safeUser).not.toHaveProperty('tokenHash');
    expect(safeUser).not.toHaveProperty('passwordHash');
  });

  it('TEST 12 — User business data remains attached to canonical users.id', async () => {
    const [cat] = await db
      .insert(schema.categories)
      .values({
        name: 'Test Category',
        slug: 'test-category-1',
      })
      .returning();

    const [c] = await db
      .insert(schema.courses)
      .values({
        categoryId: cat.id,
        title: 'Test Course',
        slug: 'test-course-1',
        shortDescription: 'Short desc',
        description: 'Test Description',
        presenterName: 'Presenter',
        createdBy: testUserId,
      })
      .returning();

    const [e] = await db
      .insert(schema.enrollments)
      .values({
        studentId: testUserId,
        courseId: c.id,
        status: 'ENROLLED',
        priceAtEnrollment: '0',
        currencyAtEnrollment: 'ETB',
      })
      .returning();

    expect(e.studentId).toBe(testUserId);

    const authUser = await findAuthUserByTelegramId(db, '847362910');
    expect(authUser?.id).toBe(testUserId);

    const userEnrollments = await db
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.studentId, authUser?.id!));
    expect(userEnrollments.length).toBe(1);
    expect(userEnrollments[0].courseId).toBe(c.id);
  });
});
