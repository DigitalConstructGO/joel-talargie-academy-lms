import { asc, desc, sql } from 'drizzle-orm';
import {
  check,
  customType,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
};
const tsvector = (colName: string) => text(colName);

export const pgEnum = <T extends string>(_name: string, values: [T, ...T[]]) => {
  return (colName: string) => text(colName, { enum: values });
};

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
export const paymentMethodType = pgEnum('payment_method_type', [
  'MOBILE_MONEY',
  'BANK_TRANSFER',
  'CARD',
  'OTHER',
]);
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
export const smsDeliveryStatus = pgEnum('sms_delivery_status', [
  'QUEUED',
  'PROCESSING',
  'SUCCEEDED',
  'RETRY_SCHEDULED',
  'FAILED',
  'CANCELLED',
  'SUPPRESSED',
]);
export const smsAttemptStatus = pgEnum('sms_attempt_status', [
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

export const promoDiscountType = pgEnum('promo_discount_type', ['PERCENTAGE', 'FIXED', 'FREE']);
export const newsletterStatus = pgEnum('newsletter_status', ['ACTIVE', 'UNSUBSCRIBED']);
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

export const users = sqliteTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    emailNormalized: text('email_normalized').notNull(),
    passwordHash: text('password_hash').notNull(),
    googleId: text('google_id'),
    avatarUrl: text('avatar_url'),
    provider: authProvider('provider').notNull().default('LOCAL'),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    status: userStatus('status').notNull().default('PENDING_VERIFICATION'),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
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

export const userProfiles = sqliteTable('user_profiles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  bio: text('bio'),
  ...timestamps,
});

export const refreshSessions = sqliteTable(
  'refresh_sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' }).notNull().defaultNow(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_sessions_user_idx').on(table.userId),
    index('refresh_sessions_expires_idx').on(table.expiresAt),
    index('refresh_sessions_active_idx')
      .on(table.userId, table.expiresAt)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
);

export const oauthAccounts = sqliteTable(
  'oauth_accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProvider('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    providerEmail: text('provider_email'),
    linkedAt: integer('linked_at', { mode: 'timestamp' }).notNull().defaultNow(),
    lastLoginAt: integer('last_login_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('oauth_accounts_provider_account_uq').on(table.provider, table.providerAccountId),
    uniqueIndex('oauth_accounts_user_provider_uq').on(table.userId, table.provider),
    index('oauth_accounts_user_idx').on(table.userId),
  ],
);

export const userNotificationPreferences = sqliteTable('user_notification_preferences', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  emailSecurity: integer('email_security', { mode: 'boolean' }).notNull().default(true),
  emailLearning: integer('email_learning', { mode: 'boolean' }).notNull().default(true),
  emailPayments: integer('email_payments', { mode: 'boolean' }).notNull().default(true),
  emailCertificates: integer('email_certificates', { mode: 'boolean' }).notNull().default(true),
  inAppLearning: integer('in_app_learning', { mode: 'boolean' }).notNull().default(true),
  inAppPayments: integer('in_app_payments', { mode: 'boolean' }).notNull().default(true),
  inAppCertificates: integer('in_app_certificates', { mode: 'boolean' }).notNull().default(true),
  smsSecurity: integer('sms_security', { mode: 'boolean' }).notNull().default(true),
  smsLearning: integer('sms_learning', { mode: 'boolean' }).notNull().default(true),
  smsPayments: integer('sms_payments', { mode: 'boolean' }).notNull().default(true),
  smsCertificates: integer('sms_certificates', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
});

export const emailVerificationTokens = sqliteTable(
  'email_verification_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [index('email_verification_tokens_user_idx').on(table.userId)],
);
export const passwordResetTokens = sqliteTable(
  'password_reset_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [index('password_reset_tokens_user_idx').on(table.userId)],
);
export const loginAttempts = sqliteTable(
  'login_attempts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    emailNormalized: text('email_normalized').notNull(),
    successful: integer('successful', { mode: 'boolean' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [index('login_attempts_user_idx').on(table.userId)],
);

export const roles = sqliteTable(
  'roles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text('code').notNull().unique(),
    name: text('name').notNull().unique(),
    description: text('description'),
    isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [index('roles_active_code_idx').on(table.archivedAt, table.code)],
);
export const permissions = sqliteTable('permissions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  module: text('module').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
});
export const userRoles = sqliteTable(
  'user_roles',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().defaultNow(),
    assignedBy: text('assigned_by').references(() => users.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('user_roles_role_idx').on(table.roleId),
  ],
);
export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'restrict' }),
    assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index('role_permissions_permission_idx').on(table.permissionId),
  ],
);

export const categories = sqliteTable(
  'categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    parentId: text('parent_id').references((): AnySQLiteColumn => categories.id, {
      onDelete: 'restrict',
    }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    imageKey: text('image_key'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [
    index('categories_parent_idx').on(table.parentId),
    index('categories_parent_sort_idx').on(table.parentId, table.sortOrder, table.id),
    index('categories_active_idx')
      .on(table.name)
      .where(sql`${table.isActive} = 1 AND ${table.archivedAt} IS NULL`),
  ],
);

export const courses = sqliteTable(
  'courses',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    createdBy: text('created_by')
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
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    price: text('price').notNull().default('0'),
    discountPrice: text('discount_price'),
    currency: text('currency').notNull().default('ETB'),
    difficulty: courseDifficulty('difficulty').notNull().default('ALL_LEVELS'),
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    certificateEnabled: integer('certificate_enabled', { mode: 'boolean' })
      .notNull()
      .default(false),
    enrollmentOpenAt: integer('enrollment_open_at', { mode: 'timestamp' }),
    enrollmentCloseAt: integer('enrollment_close_at', { mode: 'timestamp' }),
    capacity: integer('capacity'),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    searchVector: tsvector('search_vector'),
    ...timestamps,
  },
  (table) => [
    index('courses_created_by_idx').on(table.createdBy),
    index('courses_catalog_idx').on(
      table.status,
      table.visibility,
      desc(table.publishedAt),
      table.id,
    ),
    index('courses_category_catalog_idx').on(table.categoryId, table.status, table.visibility),
    index('courses_access_catalog_idx').on(table.accessType, table.status, table.visibility),
    index('courses_difficulty_catalog_idx').on(table.difficulty, table.status, table.visibility),
    index('courses_featured_catalog_idx').on(table.featured, table.status, desc(table.publishedAt)),
    index('courses_published_public_idx')
      .on(desc(table.publishedAt), table.id)
      .where(
        sql`${table.status} = 'PUBLISHED' AND ${table.visibility} = 'PUBLIC' AND ${table.archivedAt} IS NULL`,
      ),
    index('courses_search_gin_idx').on(table.searchVector),
  ],
);

export const courseOutcomes = sqliteTable(
  'course_outcomes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    outcome: text('outcome').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [unique('course_outcomes_order_uq').on(table.courseId, table.sortOrder)],
);

export const courseRequirements = sqliteTable(
  'course_requirements',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    requirement: text('requirement').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [unique('course_requirements_order_uq').on(table.courseId, table.sortOrder)],
);

export const courseSections = sqliteTable(
  'course_sections',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    position: integer('position').notNull(),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [unique('course_sections_position_uq').on(table.courseId, table.position)],
);
export const lessons = sqliteTable(
  'lessons',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    sectionId: text('section_id')
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
    isMandatory: integer('is_mandatory', { mode: 'boolean' }).notNull().default(true),
    isPreview: integer('is_preview', { mode: 'boolean' }).notNull().default(false),
    isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
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
      .where(sql`${table.isPublished} = 1 AND ${table.archivedAt} IS NULL`),
  ],
);
export const lessonResources = sqliteTable(
  'lesson_resources',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    lessonId: text('lesson_id')
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

export const enrollments = sqliteTable(
  'enrollments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    lastLessonId: text('last_lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
    status: enrollmentStatus('status').notNull().default('PENDING_PAYMENT'),
    priceAtEnrollment: text('price_at_enrollment').notNull(),
    currencyAtEnrollment: text('currency_at_enrollment').notNull(),
    discountAtEnrollment: text('discount_at_enrollment').notNull().default('0'),
    progressPercentage: integer('progress_percentage').notNull().default(0),
    enrolledAt: integer('enrolled_at', { mode: 'timestamp' }),
    startedAt: integer('started_at', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
    cancelledBy: text('cancelled_by').references(() => users.id, { onDelete: 'restrict' }),
    cancellationReason: text('cancellation_reason'),
    accessRevokedAt: integer('access_revoked_at', { mode: 'timestamp' }),
    accessRevocationReason: text('access_revocation_reason'),
    ...timestamps,
  },
  (table) => [
    unique('enrollments_student_course_uq').on(table.studentId, table.courseId),
    index('enrollments_student_status_updated_idx').on(
      table.studentId,
      table.status,
      desc(table.updatedAt),
      table.id,
    ),
    index('enrollments_course_status_idx').on(table.courseId, table.status),
    index('enrollments_student_created_idx').on(table.studentId, desc(table.createdAt), table.id),
    index('enrollments_course_created_idx').on(table.courseId, desc(table.createdAt), table.id),
    index('enrollments_status_created_idx').on(table.status, desc(table.createdAt), table.id),
    index('enrollments_status_updated_idx').on(table.status, desc(table.updatedAt), table.id),
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
export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrollmentId: text('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'restrict' }),
    status: progressStatus('status').notNull().default('NOT_STARTED'),
    progressPercent: integer('progress_percent').notNull().default(0),
    lastPositionSeconds: integer('last_position_seconds'),
    firstOpenedAt: integer('first_opened_at', { mode: 'timestamp' }),
    lastViewedAt: integer('last_viewed_at', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('lesson_progress_enrollment_lesson_uq').on(table.enrollmentId, table.lessonId),
    index('lesson_progress_lesson_idx').on(table.lessonId),
    index('lesson_progress_enrollment_status_idx').on(table.enrollmentId, table.status),
    index('lesson_progress_recent_idx').on(table.enrollmentId, desc(table.lastViewedAt), table.id),
    index('lesson_progress_completed_idx')
      .on(desc(table.completedAt), table.id)
      .where(sql`${table.status} = 'COMPLETED'`),
    check(
      'lesson_progress_position_check',
      sql`${table.lastPositionSeconds} IS NULL OR ${table.lastPositionSeconds} >= 0`,
    ),
    check('lesson_progress_percent_check', sql`${table.progressPercent} BETWEEN 0 AND 100`),
  ],
);

export const paymentMethods = sqliteTable(
  'payment_methods',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    type: paymentMethodType('type').notNull().default('OTHER'),
    instructions: text('instructions', { mode: 'json' }).notNull().default({}),
    config: text('config', { mode: 'json' }).notNull().default({}),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (table) => [
    index('payment_methods_active_sort_idx').on(table.isActive, table.sortOrder, table.name),
    index('payment_methods_type_idx').on(table.type),
  ],
);

export const payments = sqliteTable(
  'payments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrollmentId: text('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'restrict' }),
    paymentMethodId: text('payment_method_id').references(() => paymentMethods.id, {
      onDelete: 'restrict',
    }),
    reviewerId: text('reviewer_id').references(() => users.id, { onDelete: 'restrict' }),
    attemptNumber: integer('attempt_number').notNull(),
    transactionId: text('transaction_id'),
    transactionIdNormalized: text('transaction_id_normalized'),
    amount: text('amount').notNull(),
    expectedAmountSnapshot: text('expected_amount_snapshot').notNull().default('0'),
    currency: text('currency').notNull(),
    paymentDate: integer('payment_date', { mode: 'timestamp' }),
    studentNote: text('student_note'),
    status: paymentStatus('status').notNull().default('PENDING'),
    amountMismatch: integer('amount_mismatch', { mode: 'boolean' }).notNull().default(false),
    mismatchApprovalReason: text('mismatch_approval_reason'),
    reviewNote: text('review_note'),
    declineReason: text('decline_reason'),
    duplicateTransactionCount: integer('duplicate_transaction_count').notNull().default(0),
    submittedAt: integer('submitted_at', { mode: 'timestamp' }).notNull().defaultNow(),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [
    unique('payments_enrollment_attempt_uq').on(table.enrollmentId, table.attemptNumber),
    index('payments_pending_queue_idx')
      .on(table.submittedAt, table.id)
      .where(sql`${table.status} = 'PENDING'`),
    index('payments_reviewer_reviewed_idx').on(table.reviewerId, desc(table.reviewedAt)),
    index('payments_transaction_idx').on(table.transactionId),
    index('payments_transaction_normalized_idx').on(table.transactionIdNormalized),
    index('payments_enrollment_submitted_idx').on(
      table.enrollmentId,
      desc(table.submittedAt),
      table.id,
    ),
    index('payments_status_submitted_idx').on(table.status, desc(table.submittedAt), table.id),
    index('payments_payment_method_idx').on(table.paymentMethodId),
    uniqueIndex('payments_one_pending_per_enrollment_uq')
      .on(table.enrollmentId)
      .where(sql`${table.status} = 'PENDING'`),
    check('payments_amount_positive_check', sql`${table.amount} > 0`),
    check('payments_expected_amount_nonnegative_check', sql`${table.expectedAmountSnapshot} >= 0`),
  ],
);
export const paymentReceipts = sqliteTable(
  'payment_receipts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    paymentId: text('payment_id')
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
    uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().defaultNow(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [unique('payment_receipts_payment_uq').on(table.paymentId)],
);

export const certificateTemplates = sqliteTable(
  'certificate_templates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    version: integer('version').notNull(),
    configuration: text('configuration', { mode: 'json' }).notNull(),
    templateStorageKey: text('template_storage_key'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (table) => [
    unique('certificate_templates_name_version_uq').on(table.name, table.version),
    uniqueIndex('certificate_templates_one_default_uq')
      .on(table.isDefault)
      .where(sql`${table.isDefault} = 1 AND ${table.isActive} = true`),
  ],
);
export const certificates = sqliteTable(
  'certificates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    enrollmentId: text('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'restrict' }),
    templateId: text('template_id')
      .notNull()
      .references(() => certificateTemplates.id, { onDelete: 'restrict' }),
    certificateNumber: text('certificate_number').notNull().unique(),
    verificationToken: text('verification_token').notNull().unique(),
    studentNameAtIssue: text('student_name_at_issue').notNull(),
    courseTitleAtIssue: text('course_title_at_issue').notNull(),
    completionDateSnapshot: integer('completion_date_snapshot', { mode: 'timestamp' }),
    templateNameSnapshot: text('template_name_snapshot'),
    templateVersionSnapshot: integer('template_version_snapshot'),
    pdfStorageKey: text('pdf_storage_key'),
    status: certificateStatus('status').notNull().default('PENDING'),
    issuedAt: integer('issued_at', { mode: 'timestamp' }),
    generatedAt: integer('generated_at', { mode: 'timestamp' }),
    generatedBy: text('generated_by').references(() => users.id, { onDelete: 'restrict' }),
    generationVersion: integer('generation_version').notNull().default(1),
    pdfChecksum: text('pdf_checksum'),
    pdfFileSize: integer('pdf_file_size'),
    pdfMimeType: text('pdf_mime_type'),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    lastGenerationAttemptAt: integer('last_generation_attempt_at', { mode: 'timestamp' }),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    revocationReason: text('revocation_reason'),
    ...timestamps,
  },
  (table) => [
    index('certificates_enrollment_status_idx').on(table.enrollmentId, table.status),
    index('certificates_generated_idx')
      .on(desc(table.issuedAt), table.id)
      .where(sql`${table.status} = 'GENERATED' AND ${table.revokedAt} IS NULL`),
    index('certificates_template_idx').on(table.templateId),
    uniqueIndex('certificates_active_enrollment_uq')
      .on(table.enrollmentId)
      .where(sql`${table.status} <> 'REVOKED'`),
    index('certificates_status_updated_idx').on(table.status, desc(table.updatedAt), table.id),
  ],
);

export const certificateFiles = sqliteTable(
  'certificate_files',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    certificateId: text('certificate_id')
      .notNull()
      .references(() => certificates.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    storageKey: text('storage_key').notNull(),
    originalFileName: text('original_file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    checksum: text('checksum').notNull(),
    isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(true),
    generatedBy: text('generated_by').references(() => users.id, { onDelete: 'restrict' }),
    generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull().defaultNow(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    unique('certificate_files_certificate_version_uq').on(table.certificateId, table.version),
    uniqueIndex('certificate_files_one_current_uq')
      .on(table.certificateId)
      .where(sql`${table.isCurrent} = true`),
    index('certificate_files_certificate_generated_idx').on(
      table.certificateId,
      desc(table.generatedAt),
      table.id,
    ),
    check('certificate_files_version_check', sql`${table.version} > 0`),
    check('certificate_files_size_check', sql`${table.fileSize} > 0`),
  ],
);
export const certificateEvents = sqliteTable(
  'certificate_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    certificateId: text('certificate_id')
      .notNull()
      .references(() => certificates.id, { onDelete: 'cascade' }),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    reason: text('reason'),
    metadata: text('metadata', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    index('certificate_events_certificate_created_idx').on(
      table.certificateId,
      desc(table.createdAt),
    ),
    index('certificate_events_actor_idx').on(table.actorId),
  ],
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: notificationChannel('channel').notNull(),
    status: notificationStatus('status').notNull().default('PENDING'),
    type: text('type').notNull().default('GENERAL'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    actionUrl: text('action_url'),
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: text('related_entity_id'),
    priority: notificationPriority('priority').notNull().default('NORMAL'),
    deduplicationKey: text('deduplication_key'),
    metadata: text('metadata', { mode: 'json' }),
    readAt: integer('read_at', { mode: 'timestamp' }),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    index('notifications_user_read_created_idx').on(
      table.userId,
      table.readAt,
      desc(table.createdAt),
      table.id,
    ),
    index('notifications_user_status_created_idx').on(
      table.userId,
      table.status,
      desc(table.createdAt),
      table.id,
    ),
    index('notifications_unread_active_in_app_idx')
      .on(table.userId, desc(table.createdAt), table.id)
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
      desc(table.createdAt),
    ),
  ],
);

export const emailTemplates = sqliteTable(
  'email_templates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text('code').notNull(),
    name: text('name').notNull(),
    subjectTemplate: text('subject_template').notNull(),
    htmlTemplate: text('html_template').notNull(),
    textTemplate: text('text_template').notNull(),
    version: integer('version').notNull().default(1),
    locale: text('locale').notNull().default('en'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(true),
    description: text('description'),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'restrict' }),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [
    unique('email_templates_code_version_locale_uq').on(table.code, table.version, table.locale),
    uniqueIndex('email_templates_active_code_locale_uq')
      .on(table.code, table.locale)
      .where(sql`${table.isActive} = 1 AND ${table.archivedAt} IS NULL`),
    index('email_templates_catalog_idx').on(table.code, table.locale, desc(table.version)),
    check('email_templates_version_check', sql`${table.version} > 0`),
    check('email_templates_code_check', sql`${table.code} ~ '^[A-Z][A-Z0-9_]{2,79}$'`),
    check('email_templates_locale_check', sql`${table.locale} ~ '^[a-z]{2}(-[A-Z]{2})?$'`),
  ],
);

export const emailDeliveries = sqliteTable(
  'email_deliveries',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
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
    relatedEntityId: text('related_entity_id'),
    scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull().defaultNow(),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    failedAt: integer('failed_at', { mode: 'timestamp' }),
    cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
    attemptCount: integer('attempt_count').notNull().default(0),
    maximumAttempts: integer('maximum_attempts').notNull().default(5),
    lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp' }),
    nextAttemptAt: integer('next_attempt_at', { mode: 'timestamp' }),
    lockedAt: integer('locked_at', { mode: 'timestamp' }),
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
      .on(desc(table.priority), table.scheduledAt, table.id)
      .where(sql`${table.status} IN ('QUEUED', 'RETRY_SCHEDULED')`),
    index('email_deliveries_user_created_idx').on(table.userId, desc(table.createdAt), table.id),
    index('email_deliveries_status_created_idx').on(table.status, desc(table.createdAt), table.id),
    index('email_deliveries_template_created_idx').on(table.templateCode, desc(table.createdAt)),
    check('email_deliveries_attempts_check', sql`${table.maximumAttempts} > 0`),
  ],
);

export const emailDeliveryAttempts = sqliteTable(
  'email_delivery_attempts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    deliveryId: text('delivery_id')
      .notNull()
      .references(() => emailDeliveries.id, { onDelete: 'restrict' }),
    attemptNumber: integer('attempt_number').notNull(),
    workerId: text('worker_id'),
    startedAt: integer('started_at', { mode: 'timestamp' }).notNull().defaultNow(),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    status: emailAttemptStatus('status').notNull().default('PROCESSING'),
    providerResponseCode: text('provider_response_code'),
    providerMessageId: text('provider_message_id'),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    unique('email_delivery_attempts_delivery_number_uq').on(table.deliveryId, table.attemptNumber),
    index('email_delivery_attempts_delivery_created_idx').on(
      table.deliveryId,
      desc(table.createdAt),
      table.id,
    ),
  ],
);
export const smsDeliveries = sqliteTable(
  'sms_deliveries',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    recipientPhone: text('recipient_phone').notNull(),
    messageText: text('message_text').notNull(),
    templateCode: text('template_code').notNull(),
    status: smsDeliveryStatus('status').notNull().default('QUEUED'),
    priority: notificationPriority('priority').notNull().default('NORMAL'),
    deduplicationKey: text('deduplication_key'),
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: text('related_entity_id'),
    scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull().defaultNow(),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    failedAt: integer('failed_at', { mode: 'timestamp' }),
    cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
    attemptCount: integer('attempt_count').notNull().default(0),
    maximumAttempts: integer('maximum_attempts').notNull().default(3),
    lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp' }),
    nextAttemptAt: integer('next_attempt_at', { mode: 'timestamp' }),
    lockedAt: integer('locked_at', { mode: 'timestamp' }),
    lockedBy: text('locked_by'),
    providerMessageId: text('provider_message_id'),
    providerLogId: text('provider_log_id'),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('sms_deliveries_deduplication_key_uq')
      .on(table.deduplicationKey)
      .where(sql`${table.deduplicationKey} IS NOT NULL`),
    index('sms_deliveries_claim_idx')
      .on(desc(table.priority), table.scheduledAt, table.id)
      .where(sql`${table.status} IN ('QUEUED', 'RETRY_SCHEDULED')`),
    index('sms_deliveries_user_created_idx').on(table.userId, desc(table.createdAt), table.id),
    index('sms_deliveries_status_created_idx').on(table.status, desc(table.createdAt), table.id),
    check('sms_deliveries_attempts_check', sql`${table.maximumAttempts} > 0`),
  ],
);

export const smsDeliveryAttempts = sqliteTable(
  'sms_delivery_attempts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    deliveryId: text('delivery_id')
      .notNull()
      .references(() => smsDeliveries.id, { onDelete: 'cascade' }),
    attemptNumber: integer('attempt_number').notNull(),
    workerId: text('worker_id'),
    startedAt: integer('started_at', { mode: 'timestamp' }).notNull().defaultNow(),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    status: smsAttemptStatus('status').notNull().default('PROCESSING'),
    providerResponseCode: text('provider_response_code'),
    providerMessageId: text('provider_message_id'),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    unique('sms_delivery_attempts_delivery_number_uq').on(table.deliveryId, table.attemptNumber),
    index('sms_delivery_attempts_delivery_created_idx').on(
      table.deliveryId,
      desc(table.createdAt),
      table.id,
    ),
  ],
);

export const notificationEvents = sqliteTable(
  'notification_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    notificationId: text('notification_id').references(() => notifications.id, {
      onDelete: 'restrict',
    }),
    emailDeliveryId: text('email_delivery_id').references(() => emailDeliveries.id, {
      onDelete: 'restrict',
    }),
    eventType: text('event_type').notNull(),
    channel: notificationChannel('channel').notNull(),
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: text('related_entity_id'),
    safeMetadataJson: text('safe_metadata_json', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    index('notification_events_user_created_idx').on(table.userId, desc(table.createdAt)),
    index('notification_events_delivery_created_idx').on(
      table.emailDeliveryId,
      desc(table.createdAt),
    ),
  ],
);
export const activityLogs = sqliteTable(
  'activity_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    before: text('before', { mode: 'json' }),
    after: text('after', { mode: 'json' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    index('activity_logs_entity_created_idx').on(
      table.entityType,
      table.entityId,
      desc(table.createdAt),
      table.id,
    ),
    index('activity_logs_actor_created_idx').on(table.actorId, desc(table.createdAt), table.id),
    index('activity_logs_action_created_idx').on(table.action, desc(table.createdAt), table.id),
  ],
);
export const platformSettings = sqliteTable(
  'platform_settings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    key: text('key').notNull().unique(),
    value: text('value', { mode: 'json' }).notNull(),
    updatedBy: text('updated_by').references(() => users.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (table) => [index('platform_settings_updated_by_idx').on(table.updatedBy)],
);
export const reportExports = sqliteTable(
  'report_exports',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requestedBy: text('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    reportType: text('report_type').notNull(),
    format: reportExportFormat('format').notNull(),
    status: reportExportStatus('status').notNull().default('QUEUED'),
    filtersJson: text('filters_json', { mode: 'json' }).notNull().default({}),
    selectedColumnsJson: text('selected_columns_json', { mode: 'json' }),
    sortJson: text('sort_json', { mode: 'json' }),
    locale: text('locale').notNull().default('en'),
    timezone: text('timezone').notNull().default('UTC'),
    requestedAt: integer('requested_at', { mode: 'timestamp' }).notNull().defaultNow(),
    startedAt: integer('started_at', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    failedAt: integer('failed_at', { mode: 'timestamp' }),
    cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
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
      desc(table.createdAt),
      table.id,
    ),
    index('report_exports_status_created_idx').on(table.status, desc(table.createdAt), table.id),
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
export const backgroundJobs = sqliteTable(
  'background_jobs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobType: text('job_type').notNull(),
    status: jobStatus('status').notNull().default('PENDING'),
    payload: text('payload', { mode: 'json' }).notNull(),
    deduplicationKey: text('deduplication_key'),
    priority: integer('priority').notNull().default(100),
    scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull().defaultNow(),
    lockedAt: integer('locked_at', { mode: 'timestamp' }),
    lockedBy: text('locked_by'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
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

export const uploadedFiles = sqliteTable(
  'uploaded_files',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
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
    relatedUserId: text('related_user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [
    index('uploaded_files_category_idx').on(table.category, desc(table.createdAt)),
    index('uploaded_files_created_by_idx').on(table.createdBy),
    uniqueIndex('uploaded_files_active_avatar_uq')
      .on(table.relatedUserId)
      .where(sql`${table.category} = 'AVATAR' AND ${table.deletedAt} IS NULL`),
    check('uploaded_files_size_check', sql`${table.fileSize} > 0`),
  ],
);

export const promoAffiliates = sqliteTable(
  'promo_affiliates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    status: promoAffiliateStatus('status').notNull().default('PENDING'),
    commissionType: promoDiscountType('commission_type').notNull().default('PERCENTAGE'),
    commissionRate: text('commission_rate'),
    commissionFixedAmount: text('commission_fixed_amount'),
    totalClicks: integer('total_clicks').notNull().default(0),
    totalEnrollments: integer('total_enrollments').notNull().default(0),
    totalRevenue: text('total_revenue').notNull().default('0'),
    totalCommission: text('total_commission').notNull().default('0'),
    notes: text('notes'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
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

export const promoCodes = sqliteTable(
  'promo_codes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text('code').notNull(),
    codeType: promoCodeType('code_type').notNull().default('MANUAL'),
    status: promoCodeStatus('status').notNull().default('ACTIVE'),
    discountType: promoDiscountType('discount_type').notNull().default('PERCENTAGE'),
    discountValue: text('discount_value').notNull().default('0'),
    ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    affiliateId: text('affiliate_id').references(() => promoAffiliates.id, {
      onDelete: 'set null',
    }),
    isSingleUse: integer('is_single_use', { mode: 'boolean' }).notNull().default(false),
    maxUsers: integer('max_users'),
    redemptionCount: integer('redemption_count').notNull().default(0),
    validFrom: integer('valid_from', { mode: 'timestamp' }),
    validUntil: integer('valid_until', { mode: 'timestamp' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('promo_codes_code_uq').on(table.code),
    index('promo_codes_owner_idx').on(table.ownerUserId),
    index('promo_codes_affiliate_idx').on(table.affiliateId),
    index('promo_codes_status_idx').on(table.status),
    index('promo_codes_valid_window_idx').on(table.validFrom, table.validUntil),
    check('promo_codes_max_users_check', sql`${table.maxUsers} IS NULL OR ${table.maxUsers} >= 1`),
    check(
      'promo_codes_window_check',
      sql`${table.validFrom} IS NULL OR ${table.validUntil} IS NULL OR ${table.validUntil} > ${table.validFrom}`,
    ),
    check('promo_codes_discount_value_check', sql`${table.discountValue} >= 0`),
    check(
      'promo_codes_percentage_bounds_check',
      sql`${table.discountType} <> 'PERCENTAGE' OR ${table.discountValue} <= 100`,
    ),
  ],
);

export const promoCodeCourseRules = sqliteTable(
  'promo_code_course_rules',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    codeId: text('code_id')
      .notNull()
      .references(() => promoCodes.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    unique('promo_code_course_rules_code_course_uq').on(table.codeId, table.courseId),
    index('promo_code_course_rules_course_idx').on(table.courseId),
  ],
);

export const promoCodeCategoryRules = sqliteTable(
  'promo_code_category_rules',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    codeId: text('code_id')
      .notNull()
      .references(() => promoCodes.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    unique('promo_code_category_rules_code_category_uq').on(table.codeId, table.categoryId),
    index('promo_code_category_rules_category_idx').on(table.categoryId),
  ],
);

export const promoCodeUserRules = sqliteTable(
  'promo_code_user_rules',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    codeId: text('code_id')
      .notNull()
      .references(() => promoCodes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    unique('promo_code_user_rules_code_user_uq').on(table.codeId, table.userId),
    index('promo_code_user_rules_user_idx').on(table.userId),
  ],
);

export const promoRedemptions = sqliteTable(
  'promo_redemptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    codeId: text('code_id')
      .notNull()
      .references(() => promoCodes.id, { onDelete: 'restrict' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    enrollmentId: text('enrollment_id').references(() => enrollments.id, {
      onDelete: 'set null',
    }),
    paymentId: text('payment_id').references(() => payments.id, { onDelete: 'set null' }),
    status: promoRedemptionStatus('status').notNull().default('CONFIRMED'),
    originalPrice: text('original_price').notNull(),
    discountAmount: text('discount_amount').notNull(),
    finalPrice: text('final_price').notNull(),
    currency: text('currency').notNull(),
    affiliateId: text('affiliate_id').references(() => promoAffiliates.id, {
      onDelete: 'set null',
    }),
    affiliateCommissionAmount: text('affiliate_commission_amount'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    deviceType: text('device_type'),
    redeemedAt: integer('redeemed_at', { mode: 'timestamp' }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index('promo_redemptions_code_idx').on(table.codeId),
    index('promo_redemptions_student_idx').on(table.studentId, desc(table.redeemedAt)),
    index('promo_redemptions_course_idx').on(table.courseId),
    index('promo_redemptions_affiliate_idx').on(table.affiliateId),
    index('promo_redemptions_enrollment_idx').on(table.enrollmentId),
    index('promo_redemptions_payment_idx').on(table.paymentId),
    index('promo_redemptions_active_code_student_idx')
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

export const promoUsageLogs = sqliteTable(
  'promo_usage_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    codeId: text('code_id').references(() => promoCodes.id, { onDelete: 'set null' }),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    metadata: text('metadata', { mode: 'json' }).notNull().default({}),
    ipAddress: text('ip_address'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  },
  (table) => [
    index('promo_usage_logs_code_idx').on(table.codeId, desc(table.createdAt)),
    index('promo_usage_logs_action_idx').on(table.action, desc(table.createdAt)),
  ],
);

export const newsletterSubscribers = sqliteTable(
  'newsletter_subscribers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    status: newsletterStatus('status').notNull().default('ACTIVE'),
    subscribedAt: integer('subscribed_at', { mode: 'timestamp' }).notNull().defaultNow(),
    unsubscribedAt: integer('unsubscribed_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (table) => [
    index('newsletter_subscribers_email_idx').on(table.email),
    index('newsletter_subscribers_status_idx').on(table.status),
    index('newsletter_subscribers_subscribed_at_idx').on(desc(table.subscribedAt)),
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
  paymentMethods,
  paymentReceipts,
  certificateTemplates,
  certificates,
  certificateEvents,
  certificateFiles,
  notifications,
  emailTemplates,
  emailDeliveries,
  emailDeliveryAttempts,
  smsDeliveries,
  smsDeliveryAttempts,
  notificationEvents,
  activityLogs,
  platformSettings,
  reportExports,
  backgroundJobs,
  uploadedFiles,
  promoAffiliates,
  promoCodes,
  promoCodeCourseRules,
  promoCodeCategoryRules,
  promoCodeUserRules,
  promoRedemptions,
  promoUsageLogs,
  newsletterSubscribers,
};
