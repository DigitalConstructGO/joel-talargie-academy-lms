import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

export const userStatus = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'PENDING',
  'PENDING_VERIFICATION',
  'ARCHIVED',
]);
export const authProvider = pgEnum('auth_provider', ['LOCAL', 'GOOGLE']);
export const courseStatus = pgEnum('course_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const courseVisibility = pgEnum('course_visibility', ['PUBLIC', 'PRIVATE', 'UNLISTED']);
export const courseAccessType = pgEnum('course_access_type', ['FREE', 'PAID']);
export const courseDifficulty = pgEnum('course_difficulty', [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'ALL_LEVELS',
]);
export const lessonType = pgEnum('lesson_type', [
  'VIDEO',
  'TEXT',
  'DOCUMENT',
  'DOWNLOAD',
  'EXTERNAL_LINK',
]);
export const resourceVisibility = pgEnum('resource_visibility', [
  'PUBLIC',
  'ENROLLED_STUDENTS',
  'ADMIN_ONLY',
]);
export const enrollmentStatus = pgEnum('enrollment_status', [
  'PENDING_PAYMENT',
  'WAITING_APPROVAL',
  'ENROLLED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'ACCESS_REVOKED',
]);
export const progressStatus = pgEnum('progress_status', [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
]);
export const paymentStatus = pgEnum('payment_status', ['PENDING', 'APPROVED', 'DECLINED']);
export const certificateStatus = pgEnum('certificate_status', [
  'PENDING',
  'GENERATED',
  'FAILED',
  'REVOKED',
]);
export const notificationStatus = pgEnum('notification_status', ['PENDING', 'SENT', 'FAILED']);
export const notificationChannel = pgEnum('notification_channel', ['IN_APP', 'EMAIL']);
export const notificationPriority = pgEnum('notification_priority', [
  'LOW',
  'NORMAL',
  'HIGH',
  'CRITICAL',
]);
export const emailDeliveryStatus = pgEnum('email_delivery_status', [
  'QUEUED',
  'PROCESSING',
  'SENT',
  'RETRY_SCHEDULED',
  'FAILED',
  'CANCELLED',
  'SUPPRESSED',
]);
export const emailAttemptStatus = pgEnum('email_attempt_status', [
  'PROCESSING',
  'SUCCEEDED',
  'TEMPORARY_FAILURE',
  'PERMANENT_FAILURE',
]);
export const jobStatus = pgEnum('job_status', ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']);
export const reportExportStatus = pgEnum('report_export_status', [
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
]);
export const reportExportFormat = pgEnum('report_export_format', ['CSV', 'XLSX', 'PDF']);
export const uploadCategory = pgEnum('upload_category', [
  'AVATAR',
  'COURSE_THUMBNAIL',
  'LESSON_RESOURCE',
]);

export const promoCampaignType = pgEnum('promo_campaign_type', [
  'PERCENTAGE_DISCOUNT',
  'FIXED_DISCOUNT',
  'FREE_COURSE',
  'SCHOLARSHIP',
  'BUNDLE_DISCOUNT',
  'REFERRAL_REWARD',
  'AFFILIATE_DISCOUNT',
  'CORPORATE_DISCOUNT',
  'PARTNER_DISCOUNT',
  'EVENT_PROMOTION',
  'FLASH_SALE',
  'SEASONAL_PROMOTION',
  'FIRST_STUDENT_DISCOUNT',
  'BIRTHDAY_COUPON',
  'MANUAL_COUPON',
  'AUTOMATIC_PROMOTION',
]);
export const promoCampaignStatus = pgEnum('promo_campaign_status', [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'ARCHIVED',
]);
export const promoDiscountType = pgEnum('promo_discount_type', ['PERCENTAGE', 'FIXED', 'FREE']);
export const promoCodeType = pgEnum('promo_code_type', [
  'MANUAL',
  'REFERRAL',
  'AFFILIATE',
  'CORPORATE',
  'UNIVERSITY_PARTNER',
  'SYSTEM_GENERATED',
]);
export const promoCodeStatus = pgEnum('promo_code_status', [
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'REVOKED',
]);
export const promoRedemptionStatus = pgEnum('promo_redemption_status', [
  'RESERVED',
  'CONFIRMED',
  'CANCELLED',
  'FAILED',
]);
export const promoAffiliateStatus = pgEnum('promo_affiliate_status', [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'TERMINATED',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    emailNormalized: text('email_normalized').notNull(),
    passwordHash: text('password_hash').notNull(),
    googleId: text('google_id'),
    avatarUrl: text('avatar_url'),
    provider: authProvider('provider').notNull().default('LOCAL'),
    emailVerified: boolean('email_verified').notNull().default(false),
    status: userStatus('status').notNull().default('PENDING_VERIFICATION'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('users_email_normalized_uidx').on(table.emailNormalized),
    uniqueIndex('users_google_id_uidx').on(table.googleId),
    index('users_status_idx').on(table.status),
    index('users_active_idx')
      .on(table.id)
      .where(sql`${table.status} = 'ACTIVE' AND ${table.archivedAt} IS NULL`),
  ],
);

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  bio: text('bio'),
  ...timestamps,
});

export const refreshSessions = pgTable(
  'refresh_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_sessions_user_idx').on(table.userId),
    index('refresh_sessions_expires_idx').on(table.expiresAt),
    index('refresh_sessions_active_idx')
      .on(table.userId, table.expiresAt)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
);

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProvider('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    providerEmail: text('provider_email'),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('oauth_accounts_provider_account_uq').on(table.provider, table.providerAccountId),
    unique('oauth_accounts_user_provider_uq').on(table.userId, table.provider),
    index('oauth_accounts_user_idx').on(table.userId),
  ],
);

export const userNotificationPreferences = pgTable('user_notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  emailSecurity: boolean('email_security').notNull().default(true),
  emailLearning: boolean('email_learning').notNull().default(true),
  emailPayments: boolean('email_payments').notNull().default(true),
  emailCertificates: boolean('email_certificates').notNull().default(true),
  inAppLearning: boolean('in_app_learning').notNull().default(true),
  inAppPayments: boolean('in_app_payments').notNull().default(true),
  inAppCertificates: boolean('in_app_certificates').notNull().default(true),
  ...timestamps,
});

export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('email_verification_tokens_user_idx').on(table.userId)],
);
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('password_reset_tokens_user_idx').on(table.userId)],
);
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    emailNormalized: text('email_normalized').notNull(),
    successful: boolean('successful').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('login_attempts_user_idx').on(table.userId)],
);

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    name: text('name').notNull().unique(),
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('roles_active_code_idx').on(table.archivedAt, table.code)],
);
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  module: text('module').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('user_roles_role_idx').on(table.roleId),
  ],
);
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'restrict' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index('role_permissions_permission_idx').on(table.permissionId),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'restrict',
    }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    imageKey: text('image_key'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('categories_parent_idx').on(table.parentId),
    index('categories_parent_sort_idx').on(table.parentId, table.sortOrder, table.id),
    index('categories_active_idx')
      .on(table.name)
      .where(sql`${table.isActive} = true AND ${table.archivedAt} IS NULL`),
  ],
);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    shortDescription: text('short_description').notNull(),
    description: text('description').notNull().default(''),
    thumbnailKey: text('thumbnail_key'),
    presenterName: text('presenter_name').notNull(),
    status: courseStatus('status').notNull().default('DRAFT'),
    visibility: courseVisibility('visibility').notNull().default('PRIVATE'),
    accessType: courseAccessType('access_type').notNull().default('FREE'),
    featured: boolean('featured').notNull().default(false),
    price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
    discountPrice: numeric('discount_price', { precision: 12, scale: 2 }),
    currency: text('currency').notNull().default('USD'),
    difficulty: courseDifficulty('difficulty').notNull().default('ALL_LEVELS'),
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    certificateEnabled: boolean('certificate_enabled').notNull().default(false),
    enrollmentOpenAt: timestamp('enrollment_open_at', { withTimezone: true }),
    enrollmentCloseAt: timestamp('enrollment_close_at', { withTimezone: true }),
    capacity: integer('capacity'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`setweight(to_tsvector('simple', coalesce(${sql.raw('title')}, '')), 'A') || setweight(to_tsvector('simple', coalesce(${sql.raw('short_description')}, '')), 'B') || setweight(to_tsvector('simple', coalesce(${sql.raw('presenter_name')}, '')), 'B') || setweight(to_tsvector('simple', coalesce(${sql.raw('slug')}, '')), 'C')`,
    ),
    ...timestamps,
  },
  (table) => [
    index('courses_created_by_idx').on(table.createdBy),
    index('courses_catalog_idx').on(
      table.status,
      table.visibility,
      table.publishedAt.desc(),
      table.id,
    ),
    index('courses_category_catalog_idx').on(table.categoryId, table.status, table.visibility),
    index('courses_access_catalog_idx').on(table.accessType, table.status, table.visibility),
    index('courses_difficulty_catalog_idx').on(table.difficulty, table.status, table.visibility),
    index('courses_featured_catalog_idx').on(
      table.featured,
      table.status,
      table.publishedAt.desc(),
    ),
    index('courses_published_public_idx')
      .on(table.publishedAt.desc(), table.id)
      .where(
        sql`${table.status} = 'PUBLISHED' AND ${table.visibility} = 'PUBLIC' AND ${table.archivedAt} IS NULL`,
      ),
    index('courses_search_gin_idx').using('gin', table.searchVector),
  ],
);

export const courseOutcomes = pgTable(
  'course_outcomes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    outcome: text('outcome').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('course_outcomes_order_uq').on(table.courseId, table.sortOrder)],
);

export const courseRequirements = pgTable(
  'course_requirements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    requirement: text('requirement').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('course_requirements_order_uq').on(table.courseId, table.sortOrder)],
);

export const courseSections = pgTable(
  'course_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    position: integer('position').notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [unique('course_sections_position_uq').on(table.courseId, table.position)],
);
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => courseSections.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content'),
    lessonType: lessonType('lesson_type').notNull().default('TEXT'),
    videoUrl: text('video_url'),
    externalUrl: text('external_url'),
    durationSeconds: integer('duration_seconds'),
    position: integer('position').notNull(),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    isPreview: boolean('is_preview').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique('lessons_course_slug_uq').on(table.courseId, table.slug),
    index('lessons_section_position_idx').on(table.sectionId, table.position),
    index('lessons_active_course_idx')
      .on(table.courseId, table.position)
      .where(sql`${table.archivedAt} IS NULL`),
    index('lessons_published_idx')
      .on(table.courseId, table.position, table.id)
      .where(sql`${table.isPublished} = true AND ${table.archivedAt} IS NULL`),
  ],
);
export const lessonResources = pgTable(
  'lesson_resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    resourceType: text('resource_type').notNull(),
    storageKey: text('storage_key'),
    externalUrl: text('external_url'),
    originalFileName: text('original_file_name'),
    mimeType: text('mime_type'),
    fileSize: integer('file_size'),
    visibility: resourceVisibility('visibility').notNull().default('ENROLLED_STUDENTS'),
    position: integer('position').notNull(),
    ...timestamps,
  },
  (table) => [index('lesson_resources_lesson_position_idx').on(table.lessonId, table.position)],
);

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    lastLessonId: uuid('last_lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
    status: enrollmentStatus('status').notNull().default('PENDING_PAYMENT'),
    priceAtEnrollment: numeric('price_at_enrollment', { precision: 12, scale: 2 }).notNull(),
    currencyAtEnrollment: text('currency_at_enrollment').notNull(),
    discountAtEnrollment: numeric('discount_at_enrollment', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    progressPercentage: integer('progress_percentage').notNull().default(0),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: uuid('cancelled_by').references(() => users.id, { onDelete: 'restrict' }),
    cancellationReason: text('cancellation_reason'),
    accessRevokedAt: timestamp('access_revoked_at', { withTimezone: true }),
    accessRevocationReason: text('access_revocation_reason'),
    ...timestamps,
  },
  (table) => [
    unique('enrollments_student_course_uq').on(table.studentId, table.courseId),
    index('enrollments_student_status_updated_idx').on(
      table.studentId,
      table.status,
      table.updatedAt.desc(),
      table.id,
    ),
    index('enrollments_course_status_idx').on(table.courseId, table.status),
    index('enrollments_student_created_idx').on(table.studentId, table.createdAt.desc(), table.id),
    index('enrollments_course_created_idx').on(table.courseId, table.createdAt.desc(), table.id),
    index('enrollments_status_created_idx').on(table.status, table.createdAt.desc(), table.id),
    index('enrollments_status_updated_idx').on(table.status, table.updatedAt.desc(), table.id),
    index('enrollments_capacity_idx')
      .on(table.courseId, table.status)
      .where(
        sql`${table.status} IN ('PENDING_PAYMENT', 'WAITING_APPROVAL', 'ENROLLED', 'IN_PROGRESS', 'COMPLETED')`,
      ),
    index('enrollments_cancelled_by_idx').on(table.cancelledBy),
    index('enrollments_last_lesson_idx').on(table.lastLessonId),
    check(
      'enrollments_progress_percentage_check',
      sql`${table.progressPercentage} BETWEEN 0 AND 100`,
    ),
    check('enrollments_price_snapshot_check', sql`${table.priceAtEnrollment} >= 0`),
    check('enrollments_discount_snapshot_check', sql`${table.discountAtEnrollment} >= 0`),
  ],
);
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'restrict' }),
    status: progressStatus('status').notNull().default('NOT_STARTED'),
    progressPercent: integer('progress_percent').notNull().default(0),
    lastPositionSeconds: integer('last_position_seconds'),
    firstOpenedAt: timestamp('first_opened_at', { withTimezone: true }),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique('lesson_progress_enrollment_lesson_uq').on(table.enrollmentId, table.lessonId),
    index('lesson_progress_lesson_idx').on(table.lessonId),
    index('lesson_progress_enrollment_status_idx').on(table.enrollmentId, table.status),
    index('lesson_progress_recent_idx').on(table.enrollmentId, table.lastViewedAt.desc(), table.id),
    index('lesson_progress_completed_idx')
      .on(table.completedAt.desc(), table.id)
      .where(sql`${table.status} = 'COMPLETED'`),
    check(
      'lesson_progress_position_check',
      sql`${table.lastPositionSeconds} IS NULL OR ${table.lastPositionSeconds} >= 0`,
    ),
    check('lesson_progress_percent_check', sql`${table.progressPercent} BETWEEN 0 AND 100`),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'restrict' }),
    reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'restrict' }),
    attemptNumber: integer('attempt_number').notNull(),
    transactionId: text('transaction_id'),
    transactionIdNormalized: text('transaction_id_normalized'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    expectedAmountSnapshot: numeric('expected_amount_snapshot', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    currency: text('currency').notNull(),
    paymentDate: timestamp('payment_date', { withTimezone: true }),
    studentNote: text('student_note'),
    status: paymentStatus('status').notNull().default('PENDING'),
    amountMismatch: boolean('amount_mismatch').notNull().default(false),
    mismatchApprovalReason: text('mismatch_approval_reason'),
    reviewNote: text('review_note'),
    declineReason: text('decline_reason'),
    duplicateTransactionCount: integer('duplicate_transaction_count').notNull().default(0),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique('payments_enrollment_attempt_uq').on(table.enrollmentId, table.attemptNumber),
    index('payments_pending_queue_idx')
      .on(table.submittedAt, table.id)
      .where(sql`${table.status} = 'PENDING'`),
    index('payments_reviewer_reviewed_idx').on(table.reviewerId, table.reviewedAt.desc()),
    index('payments_transaction_idx').on(table.transactionId),
    index('payments_transaction_normalized_idx').on(table.transactionIdNormalized),
    index('payments_enrollment_submitted_idx').on(
      table.enrollmentId,
      table.submittedAt.desc(),
      table.id,
    ),
    index('payments_status_submitted_idx').on(table.status, table.submittedAt.desc(), table.id),
    uniqueIndex('payments_one_pending_per_enrollment_uq')
      .on(table.enrollmentId)
      .where(sql`${table.status} = 'PENDING'`),
    check('payments_amount_positive_check', sql`${table.amount} > 0`),
    check('payments_expected_amount_nonnegative_check', sql`${table.expectedAmountSnapshot} >= 0`),
  ],
);
export const paymentReceipts = pgTable(
  'payment_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    originalFileName: text('original_file_name').notNull().default('receipt'),
    mimeType: text('mime_type').notNull(),
    detectedMimeType: text('detected_mime_type'),
    fileExtension: text('file_extension'),
    fileSize: integer('file_size').notNull().default(0),
    checksum: text('checksum'),
    storageProvider: text('storage_provider'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('payment_receipts_payment_uq').on(table.paymentId)],
);

export const certificateTemplates = pgTable(
  'certificate_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    version: integer('version').notNull(),
    configuration: jsonb('configuration').notNull(),
    templateStorageKey: text('template_storage_key'),
    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (table) => [
    unique('certificate_templates_name_version_uq').on(table.name, table.version),
    uniqueIndex('certificate_templates_one_default_uq')
      .on(table.isDefault)
      .where(sql`${table.isDefault} = true AND ${table.isActive} = true`),
  ],
);
export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'restrict' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => certificateTemplates.id, { onDelete: 'restrict' }),
    certificateNumber: text('certificate_number').notNull().unique(),
    verificationToken: text('verification_token').notNull().unique(),
    studentNameAtIssue: text('student_name_at_issue').notNull(),
    courseTitleAtIssue: text('course_title_at_issue').notNull(),
    completionDateSnapshot: timestamp('completion_date_snapshot', { withTimezone: true }),
    templateNameSnapshot: text('template_name_snapshot'),
    templateVersionSnapshot: integer('template_version_snapshot'),
    pdfStorageKey: text('pdf_storage_key'),
    status: certificateStatus('status').notNull().default('PENDING'),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    generatedAt: timestamp('generated_at', { withTimezone: true }),
    generatedBy: uuid('generated_by').references(() => users.id, { onDelete: 'restrict' }),
    generationVersion: integer('generation_version').notNull().default(1),
    pdfChecksum: text('pdf_checksum'),
    pdfFileSize: integer('pdf_file_size'),
    pdfMimeType: text('pdf_mime_type'),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    lastGenerationAttemptAt: timestamp('last_generation_attempt_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revocationReason: text('revocation_reason'),
    ...timestamps,
  },
  (table) => [
    index('certificates_enrollment_status_idx').on(table.enrollmentId, table.status),
    index('certificates_generated_idx')
      .on(table.issuedAt.desc(), table.id)
      .where(sql`${table.status} = 'GENERATED' AND ${table.revokedAt} IS NULL`),
    index('certificates_template_idx').on(table.templateId),
    uniqueIndex('certificates_active_enrollment_uq')
      .on(table.enrollmentId)
      .where(sql`${table.status} <> 'REVOKED'`),
    index('certificates_status_updated_idx').on(table.status, table.updatedAt.desc(), table.id),
  ],
);

export const certificateFiles = pgTable(
  'certificate_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    certificateId: uuid('certificate_id')
      .notNull()
      .references(() => certificates.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    storageKey: text('storage_key').notNull(),
    originalFileName: text('original_file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    checksum: text('checksum').notNull(),
    isCurrent: boolean('is_current').notNull().default(true),
    generatedBy: uuid('generated_by').references(() => users.id, { onDelete: 'restrict' }),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('certificate_files_certificate_version_uq').on(table.certificateId, table.version),
    uniqueIndex('certificate_files_one_current_uq')
      .on(table.certificateId)
      .where(sql`${table.isCurrent} = true`),
    index('certificate_files_certificate_generated_idx').on(
      table.certificateId,
      table.generatedAt.desc(),
      table.id,
    ),
    check('certificate_files_version_check', sql`${table.version} > 0`),
    check('certificate_files_size_check', sql`${table.fileSize} > 0`),
  ],
);
export const certificateEvents = pgTable(
  'certificate_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    certificateId: uuid('certificate_id')
      .notNull()
      .references(() => certificates.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    reason: text('reason'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('certificate_events_certificate_created_idx').on(
      table.certificateId,
      table.createdAt.desc(),
    ),
    index('certificate_events_actor_idx').on(table.actorId),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: notificationChannel('channel').notNull(),
    status: notificationStatus('status').notNull().default('PENDING'),
    type: text('type').notNull().default('GENERAL'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    actionUrl: text('action_url'),
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: uuid('related_entity_id'),
    priority: notificationPriority('priority').notNull().default('NORMAL'),
    deduplicationKey: text('deduplication_key'),
    metadata: jsonb('metadata'),
    readAt: timestamp('read_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notifications_user_read_created_idx').on(
      table.userId,
      table.readAt,
      table.createdAt.desc(),
      table.id,
    ),
    index('notifications_user_status_created_idx').on(
      table.userId,
      table.status,
      table.createdAt.desc(),
      table.id,
    ),
    index('notifications_unread_active_in_app_idx')
      .on(table.userId, table.createdAt.desc(), table.id)
      .where(
        sql`${table.readAt} IS NULL AND ${table.archivedAt} IS NULL AND ${table.channel} = 'IN_APP'`,
      ),
    uniqueIndex('notifications_deduplication_key_uq')
      .on(table.deduplicationKey)
      .where(sql`${table.deduplicationKey} IS NOT NULL`),
    index('notifications_user_type_priority_idx').on(
      table.userId,
      table.type,
      table.priority,
      table.createdAt.desc(),
    ),
  ],
);

export const emailTemplates = pgTable(
  'email_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    subjectTemplate: text('subject_template').notNull(),
    htmlTemplate: text('html_template').notNull(),
    textTemplate: text('text_template').notNull(),
    version: integer('version').notNull().default(1),
    locale: text('locale').notNull().default('en'),
    isActive: boolean('is_active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(true),
    description: text('description'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique('email_templates_code_version_locale_uq').on(table.code, table.version, table.locale),
    uniqueIndex('email_templates_active_code_locale_uq')
      .on(table.code, table.locale)
      .where(sql`${table.isActive} = true AND ${table.archivedAt} IS NULL`),
    index('email_templates_catalog_idx').on(table.code, table.locale, table.version.desc()),
    check('email_templates_version_check', sql`${table.version} > 0`),
    check('email_templates_code_check', sql`${table.code} ~ '^[A-Z][A-Z0-9_]{2,79}$'`),
    check('email_templates_locale_check', sql`${table.locale} ~ '^[a-z]{2}(-[A-Z]{2})?$'`),
  ],
);

export const emailDeliveries = pgTable(
  'email_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    recipientEmail: text('recipient_email').notNull(),
    recipientName: text('recipient_name'),
    templateCode: text('template_code').notNull(),
    templateVersion: integer('template_version').notNull(),
    locale: text('locale').notNull().default('en'),
    subjectSnapshot: text('subject_snapshot').notNull(),
    textBodySnapshot: text('text_body_snapshot').notNull(),
    htmlBodySnapshot: text('html_body_snapshot').notNull(),
    status: emailDeliveryStatus('status').notNull().default('QUEUED'),
    priority: notificationPriority('priority').notNull().default('NORMAL'),
    deduplicationKey: text('deduplication_key'),
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: uuid('related_entity_id'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    attemptCount: integer('attempt_count').notNull().default(0),
    maximumAttempts: integer('maximum_attempts').notNull().default(5),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: text('locked_by'),
    providerMessageId: text('provider_message_id'),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('email_deliveries_deduplication_key_uq')
      .on(table.deduplicationKey)
      .where(sql`${table.deduplicationKey} IS NOT NULL`),
    index('email_deliveries_claim_idx')
      .on(table.priority.desc(), table.scheduledAt, table.id)
      .where(sql`${table.status} IN ('QUEUED', 'RETRY_SCHEDULED')`),
    index('email_deliveries_user_created_idx').on(table.userId, table.createdAt.desc(), table.id),
    index('email_deliveries_status_created_idx').on(table.status, table.createdAt.desc(), table.id),
    index('email_deliveries_template_created_idx').on(table.templateCode, table.createdAt.desc()),
    check('email_deliveries_attempts_check', sql`${table.maximumAttempts} > 0`),
  ],
);

export const emailDeliveryAttempts = pgTable(
  'email_delivery_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deliveryId: uuid('delivery_id')
      .notNull()
      .references(() => emailDeliveries.id, { onDelete: 'restrict' }),
    attemptNumber: integer('attempt_number').notNull(),
    workerId: text('worker_id'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: emailAttemptStatus('status').notNull().default('PROCESSING'),
    providerResponseCode: text('provider_response_code'),
    providerMessageId: text('provider_message_id'),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('email_delivery_attempts_delivery_number_uq').on(table.deliveryId, table.attemptNumber),
    index('email_delivery_attempts_delivery_created_idx').on(
      table.deliveryId,
      table.createdAt.desc(),
      table.id,
    ),
  ],
);

export const notificationEvents = pgTable(
  'notification_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    notificationId: uuid('notification_id').references(() => notifications.id, {
      onDelete: 'restrict',
    }),
    emailDeliveryId: uuid('email_delivery_id').references(() => emailDeliveries.id, {
      onDelete: 'restrict',
    }),
    eventType: text('event_type').notNull(),
    channel: notificationChannel('channel').notNull(),
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: uuid('related_entity_id'),
    safeMetadataJson: jsonb('safe_metadata_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notification_events_user_created_idx').on(table.userId, table.createdAt.desc()),
    index('notification_events_delivery_created_idx').on(
      table.emailDeliveryId,
      table.createdAt.desc(),
    ),
  ],
);
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('activity_logs_entity_created_idx').on(
      table.entityType,
      table.entityId,
      table.createdAt.desc(),
      table.id,
    ),
    index('activity_logs_actor_created_idx').on(table.actorId, table.createdAt.desc(), table.id),
    index('activity_logs_action_created_idx').on(table.action, table.createdAt.desc(), table.id),
  ],
);
export const platformSettings = pgTable(
  'platform_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull().unique(),
    value: jsonb('value').notNull(),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (table) => [index('platform_settings_updated_by_idx').on(table.updatedBy)],
);
export const reportExports = pgTable(
  'report_exports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    reportType: text('report_type').notNull(),
    format: reportExportFormat('format').notNull(),
    status: reportExportStatus('status').notNull().default('QUEUED'),
    filtersJson: jsonb('filters_json').notNull().default({}),
    selectedColumnsJson: jsonb('selected_columns_json'),
    sortJson: jsonb('sort_json'),
    locale: text('locale').notNull().default('en'),
    timezone: text('timezone').notNull().default('UTC'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    rowCount: integer('row_count'),
    fileStorageKey: text('file_storage_key'),
    originalFileName: text('original_file_name'),
    mimeType: text('mime_type'),
    fileSize: integer('file_size'),
    checksum: text('checksum'),
    attemptCount: integer('attempt_count').notNull().default(0),
    maximumAttempts: integer('maximum_attempts').notNull().default(3),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    deduplicationKey: text('deduplication_key'),
    ...timestamps,
  },
  (table) => [
    index('report_exports_requester_created_idx').on(
      table.requestedBy,
      table.createdAt.desc(),
      table.id,
    ),
    index('report_exports_status_created_idx').on(table.status, table.createdAt.desc(), table.id),
    index('report_exports_expiry_idx').on(table.status, table.expiresAt),
    uniqueIndex('report_exports_active_dedup_uq')
      .on(table.deduplicationKey)
      .where(
        sql`${table.deduplicationKey} IS NOT NULL AND ${table.status} IN ('QUEUED','PROCESSING')`,
      ),
    check(
      'report_exports_attempts_check',
      sql`${table.maximumAttempts} > 0 AND ${table.attemptCount} >= 0`,
    ),
  ],
);
export const backgroundJobs = pgTable(
  'background_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobType: text('job_type').notNull(),
    status: jobStatus('status').notNull().default('PENDING'),
    payload: jsonb('payload').notNull(),
    deduplicationKey: text('deduplication_key'),
    priority: integer('priority').notNull().default(100),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: text('locked_by'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('background_jobs_pending_claim_idx')
      .on(table.scheduledAt, table.priority, table.id)
      .where(sql`${table.status} = 'PENDING'`),
    index('background_jobs_locked_idx').on(table.status, table.lockedAt),
    index('background_jobs_type_schedule_idx').on(table.jobType, table.status, table.scheduledAt),
    uniqueIndex('background_jobs_deduplication_key_uq')
      .on(table.deduplicationKey)
      .where(sql`${table.deduplicationKey} IS NOT NULL`),
  ],
);

export const uploadedFiles = pgTable(
  'uploaded_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: uploadCategory('category').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    variantStorageKey: text('variant_storage_key'),
    originalFileName: text('original_file_name').notNull(),
    storedFileName: text('stored_file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    checksum: text('checksum').notNull(),
    width: integer('width'),
    height: integer('height'),
    relatedUserId: uuid('related_user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('uploaded_files_category_idx').on(table.category, table.createdAt.desc()),
    index('uploaded_files_created_by_idx').on(table.createdBy),
    uniqueIndex('uploaded_files_active_avatar_uq')
      .on(table.relatedUserId)
      .where(sql`${table.category} = 'AVATAR' AND ${table.deletedAt} IS NULL`),
    check('uploaded_files_size_check', sql`${table.fileSize} > 0`),
  ],
);

export const promoAffiliates = pgTable(
  'promo_affiliates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    status: promoAffiliateStatus('status').notNull().default('PENDING'),
    commissionType: promoDiscountType('commission_type').notNull().default('PERCENTAGE'),
    commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }),
    commissionFixedAmount: numeric('commission_fixed_amount', { precision: 12, scale: 2 }),
    totalClicks: integer('total_clicks').notNull().default(0),
    totalEnrollments: integer('total_enrollments').notNull().default(0),
    totalRevenue: numeric('total_revenue', { precision: 14, scale: 2 }).notNull().default('0'),
    totalCommission: numeric('total_commission', { precision: 14, scale: 2 })
      .notNull()
      .default('0'),
    notes: text('notes'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('promo_affiliates_user_idx').on(table.userId),
    index('promo_affiliates_status_idx').on(table.status),
    check(
      'promo_affiliates_commission_rate_check',
      sql`${table.commissionRate} IS NULL OR (${table.commissionRate} >= 0 AND ${table.commissionRate} <= 100)`,
    ),
    check(
      'promo_affiliates_commission_fixed_check',
      sql`${table.commissionFixedAmount} IS NULL OR ${table.commissionFixedAmount} >= 0`,
    ),
  ],
);

export const promoCampaigns = pgTable(
  'promo_campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    type: promoCampaignType('type').notNull(),
    status: promoCampaignStatus('status').notNull().default('DRAFT'),
    discountType: promoDiscountType('discount_type').notNull(),
    discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull().default('0'),
    maxDiscountAmount: numeric('max_discount_amount', { precision: 12, scale: 2 }),
    minimumPurchaseAmount: numeric('minimum_purchase_amount', { precision: 12, scale: 2 }),
    isAutomatic: boolean('is_automatic').notNull().default(false),
    priority: integer('priority').notNull().default(0),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    maxRedemptions: integer('max_redemptions'),
    maxRedemptionsPerUser: integer('max_redemptions_per_user').notNull().default(1),
    redemptionCount: integer('redemption_count').notNull().default(0),
    allowedRoles: text('allowed_roles').array(),
    allowedCountries: text('allowed_countries').array(),
    allowedEmailDomains: text('allowed_email_domains').array(),
    allowedPaymentMethods: text('allowed_payment_methods').array(),
    allowedDaysOfWeek: integer('allowed_days_of_week').array(),
    allowedHourStart: integer('allowed_hour_start'),
    allowedHourEnd: integer('allowed_hour_end'),
    newStudentsOnly: boolean('new_students_only').notNull().default(false),
    restrictToInstructorId: uuid('restrict_to_instructor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    totalSeats: integer('total_seats'),
    seatsUsed: integer('seats_used').notNull().default(0),
    sponsorName: text('sponsor_name'),
    sponsorNotes: text('sponsor_notes'),
    referrerRewardType: promoDiscountType('referrer_reward_type'),
    referrerRewardValue: numeric('referrer_reward_value', { precision: 12, scale: 2 }),
    affiliateId: uuid('affiliate_id').references(() => promoAffiliates.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata').notNull().default({}),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('promo_campaigns_status_idx').on(table.status, table.startsAt.desc()),
    index('promo_campaigns_automatic_idx')
      .on(table.isAutomatic, table.status, table.priority.desc())
      .where(sql`${table.isAutomatic} = true AND ${table.archivedAt} IS NULL`),
    index('promo_campaigns_type_idx').on(table.type),
    index('promo_campaigns_window_idx').on(table.startsAt, table.endsAt),
    index('promo_campaigns_affiliate_idx').on(table.affiliateId),
    check('promo_campaigns_discount_value_check', sql`${table.discountValue} >= 0`),
    check(
      'promo_campaigns_percentage_bounds_check',
      sql`${table.discountType} <> 'PERCENTAGE' OR ${table.discountValue} <= 100`,
    ),
    check(
      'promo_campaigns_window_check',
      sql`${table.endsAt} IS NULL OR ${table.endsAt} > ${table.startsAt}`,
    ),
    check(
      'promo_campaigns_seats_check',
      sql`${table.totalSeats} IS NULL OR ${table.seatsUsed} <= ${table.totalSeats}`,
    ),
    check(
      'promo_campaigns_hour_bounds_check',
      sql`(${table.allowedHourStart} IS NULL AND ${table.allowedHourEnd} IS NULL) OR (${table.allowedHourStart} BETWEEN 0 AND 23 AND ${table.allowedHourEnd} BETWEEN 0 AND 23)`,
    ),
  ],
);

export const promoCodes = pgTable(
  'promo_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => promoCampaigns.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    codeType: promoCodeType('code_type').notNull().default('MANUAL'),
    status: promoCodeStatus('status').notNull().default('ACTIVE'),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    affiliateId: uuid('affiliate_id').references(() => promoAffiliates.id, {
      onDelete: 'set null',
    }),
    isSingleUse: boolean('is_single_use').notNull().default(false),
    maxRedemptions: integer('max_redemptions'),
    maxRedemptionsPerUser: integer('max_redemptions_per_user'),
    redemptionCount: integer('redemption_count').notNull().default(0),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('promo_codes_code_uq').on(table.code),
    index('promo_codes_campaign_idx').on(table.campaignId),
    index('promo_codes_owner_idx').on(table.ownerUserId),
    index('promo_codes_affiliate_idx').on(table.affiliateId),
    index('promo_codes_status_idx').on(table.status),
    check(
      'promo_codes_single_use_check',
      sql`NOT ${table.isSingleUse} OR ${table.maxRedemptions} = 1`,
    ),
    check(
      'promo_codes_window_check',
      sql`${table.validFrom} IS NULL OR ${table.validUntil} IS NULL OR ${table.validUntil} > ${table.validFrom}`,
    ),
  ],
);

export const promoCourseRules = pgTable(
  'promo_course_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => promoCampaigns.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('promo_course_rules_campaign_course_uq').on(table.campaignId, table.courseId),
    index('promo_course_rules_course_idx').on(table.courseId),
  ],
);

export const promoCategoryRules = pgTable(
  'promo_category_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => promoCampaigns.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('promo_category_rules_campaign_category_uq').on(table.campaignId, table.categoryId),
    index('promo_category_rules_category_idx').on(table.categoryId),
  ],
);

export const promoUserRules = pgTable(
  'promo_user_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => promoCampaigns.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('promo_user_rules_campaign_user_uq').on(table.campaignId, table.userId),
    index('promo_user_rules_user_idx').on(table.userId),
  ],
);

export const promoRedemptions = pgTable(
  'promo_redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => promoCampaigns.id, { onDelete: 'restrict' }),
    codeId: uuid('code_id').references(() => promoCodes.id, { onDelete: 'restrict' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    enrollmentId: uuid('enrollment_id').references(() => enrollments.id, {
      onDelete: 'set null',
    }),
    paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
    status: promoRedemptionStatus('status').notNull().default('RESERVED'),
    originalPrice: numeric('original_price', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull(),
    finalPrice: numeric('final_price', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull(),
    referralOwnerId: uuid('referral_owner_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    referrerRewardAmount: numeric('referrer_reward_amount', { precision: 12, scale: 2 }),
    affiliateId: uuid('affiliate_id').references(() => promoAffiliates.id, {
      onDelete: 'set null',
    }),
    affiliateCommissionAmount: numeric('affiliate_commission_amount', {
      precision: 12,
      scale: 2,
    }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    deviceType: text('device_type'),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvalDecisionAt: timestamp('approval_decision_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    ...timestamps,
  },
  (table) => [
    index('promo_redemptions_campaign_idx').on(table.campaignId, table.redeemedAt.desc()),
    index('promo_redemptions_code_idx').on(table.codeId),
    index('promo_redemptions_student_idx').on(table.studentId, table.redeemedAt.desc()),
    index('promo_redemptions_course_idx').on(table.courseId),
    index('promo_redemptions_referral_owner_idx').on(table.referralOwnerId),
    index('promo_redemptions_affiliate_idx').on(table.affiliateId),
    index('promo_redemptions_enrollment_idx').on(table.enrollmentId),
    index('promo_redemptions_payment_idx').on(table.paymentId),
    uniqueIndex('promo_redemptions_active_code_student_uq')
      .on(table.codeId, table.studentId)
      .where(sql`${table.status} IN ('RESERVED', 'CONFIRMED') AND ${table.codeId} IS NOT NULL`),
    check('promo_redemptions_discount_check', sql`${table.discountAmount} >= 0`),
    check('promo_redemptions_final_price_check', sql`${table.finalPrice} >= 0`),
    check(
      'promo_redemptions_final_price_bounds_check',
      sql`${table.finalPrice} <= ${table.originalPrice}`,
    ),
  ],
);

export const promoUsageLogs = pgTable(
  'promo_usage_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id').references(() => promoCampaigns.id, { onDelete: 'set null' }),
    codeId: uuid('code_id').references(() => promoCodes.id, { onDelete: 'set null' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('promo_usage_logs_campaign_idx').on(table.campaignId, table.createdAt.desc()),
    index('promo_usage_logs_code_idx').on(table.codeId, table.createdAt.desc()),
    index('promo_usage_logs_action_idx').on(table.action, table.createdAt.desc()),
  ],
);

export const schema = {
  users,
  userProfiles,
  refreshSessions,
  oauthAccounts,
  userNotificationPreferences,
  emailVerificationTokens,
  passwordResetTokens,
  loginAttempts,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  categories,
  courses,
  courseOutcomes,
  courseRequirements,
  courseSections,
  lessons,
  lessonResources,
  enrollments,
  lessonProgress,
  payments,
  paymentReceipts,
  certificateTemplates,
  certificates,
  certificateEvents,
  certificateFiles,
  notifications,
  emailTemplates,
  emailDeliveries,
  emailDeliveryAttempts,
  notificationEvents,
  activityLogs,
  platformSettings,
  reportExports,
  backgroundJobs,
  uploadedFiles,
  promoAffiliates,
  promoCampaigns,
  promoCodes,
  promoCourseRules,
  promoCategoryRules,
  promoUserRules,
  promoRedemptions,
  promoUsageLogs,
};
