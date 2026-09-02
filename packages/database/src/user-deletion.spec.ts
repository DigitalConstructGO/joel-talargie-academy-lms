import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { createDatabaseClient } from './infrastructure.ts';
import { schema } from './schema/index.ts';
import { permanentlyDeleteUser } from './users.ts';

describe('permanentlyDeleteUser', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    sqlite = new Database(':memory:');
    db = createDatabaseClient(sqlite as any);

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
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE user_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        bio TEXT,
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE roles (
        id TEXT PRIMARY KEY NOT NULL,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_system INTEGER NOT NULL DEFAULT 0,
        archived_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE user_roles (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT 0
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
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
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
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE enrollments (
        id TEXT PRIMARY KEY NOT NULL,
        student_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        last_lesson_id TEXT,
        status TEXT NOT NULL DEFAULT 'ENROLLED',
        price_at_enrollment TEXT NOT NULL,
        currency_at_enrollment TEXT NOT NULL,
        discount_at_enrollment TEXT NOT NULL DEFAULT '0',
        progress_percentage INTEGER NOT NULL DEFAULT 0,
        enrolled_at INTEGER,
        started_at INTEGER,
        completed_at INTEGER,
        cancelled_at INTEGER,
        cancelled_by TEXT,
        cancellation_reason TEXT,
        access_revoked_at INTEGER,
        access_revocation_reason TEXT,
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE payments (
        id TEXT PRIMARY KEY NOT NULL,
        enrollment_id TEXT,
        payment_method_id TEXT,
        reviewer_id TEXT,
        attempt_number INTEGER NOT NULL,
        transaction_id TEXT,
        transaction_id_normalized TEXT,
        amount TEXT NOT NULL,
        expected_amount_snapshot TEXT NOT NULL DEFAULT '0',
        currency TEXT NOT NULL,
        payment_date INTEGER,
        student_note TEXT,
        status TEXT NOT NULL DEFAULT 'APPROVED',
        amount_mismatch INTEGER NOT NULL DEFAULT 0,
        mismatch_approval_reason TEXT,
        review_note TEXT,
        decline_reason TEXT,
        duplicate_transaction_count INTEGER NOT NULL DEFAULT 0,
        submitted_at INTEGER NOT NULL DEFAULT 0,
        reviewed_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE activity_logs (
        id TEXT PRIMARY KEY NOT NULL,
        actor_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        before TEXT,
        after TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at INTEGER NOT NULL DEFAULT 0
      );
    `);
  });

  afterAll(() => {
    sqlite.close();
  });

  it('deletes user profile, enrollments while preserving payment transactions', async () => {
    const studentId = 'student-test-1';
    const instructorId = 'instructor-test-1';
    const categoryId = 'category-test-1';
    const courseId = 'course-test-1';
    const enrollmentId = 'enrollment-test-1';

    await db.insert(schema.users).values({
      id: studentId,
      email: 'student@example.com',
      emailNormalized: 'student@example.com',
      passwordHash: 'hash',
      status: 'ACTIVE',
    });

    await db.insert(schema.userProfiles).values({
      id: 'profile-1',
      userId: studentId,
      firstName: 'Test',
      lastName: 'Student',
    });

    await db.insert(schema.users).values({
      id: instructorId,
      email: 'instructor@example.com',
      emailNormalized: 'instructor@example.com',
      passwordHash: 'hash',
      status: 'ACTIVE',
    });

    await db.insert(schema.categories).values({
      id: categoryId,
      name: 'Development',
      slug: 'development',
    });

    await db.insert(schema.courses).values({
      id: courseId,
      categoryId,
      createdBy: instructorId,
      title: 'Testing 101',
      slug: 'testing-101',
      shortDescription: 'Desc',
      presenterName: 'Instructor',
      price: '100',
    });

    await db.insert(schema.enrollments).values({
      id: enrollmentId,
      studentId,
      courseId,
      priceAtEnrollment: '100',
      currencyAtEnrollment: 'ETB',
    });

    await db.insert(schema.payments).values({
      id: 'payment-1',
      enrollmentId,
      attemptNumber: 1,
      amount: '100',
      currency: 'ETB',
      status: 'APPROVED',
    });

    // Perform permanent deletion
    const result = await permanentlyDeleteUser(db, {
      actorId: instructorId,
      userId: studentId,
      reason: 'User requested permanent account wipe',
    });
    expect(result).toBe(true);

    // Verify user & profile are gone
    const userAfter = await db.query.users.findFirst({
      where: eq(schema.users.id, studentId),
    });
    expect(userAfter).toBeUndefined();

    const profileAfter = await db.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.userId, studentId),
    });
    expect(profileAfter).toBeUndefined();

    // Verify enrollment is gone
    const enrollmentAfter = await db.query.enrollments.findFirst({
      where: eq(schema.enrollments.id, enrollmentId),
    });
    expect(enrollmentAfter).toBeUndefined();

    // VERIFY PAYMENT TRANSACTION SURVIVES (total income metric preserved!)
    const paymentAfter = await db.query.payments.findFirst({
      where: eq(schema.payments.id, 'payment-1'),
    });
    expect(paymentAfter).not.toBeNull();
    expect(paymentAfter?.amount).toBe('100');
    expect(paymentAfter?.status).toBe('APPROVED');
    expect(paymentAfter?.enrollmentId).toBeNull();
  });
});
