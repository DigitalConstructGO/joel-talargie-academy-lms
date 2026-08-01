import { sql } from 'drizzle-orm';
import {
  boolean,
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

export const userStatus = pgEnum('user_status', ['ACTIVE', 'SUSPENDED', 'PENDING']);
export const authProvider = pgEnum('auth_provider', ['LOCAL', 'GOOGLE']);
export const courseStatus = pgEnum('course_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const courseVisibility = pgEnum('course_visibility', ['PUBLIC', 'PRIVATE']);
export const courseAccessType = pgEnum('course_access_type', ['FREE', 'PAID']);
export const enrollmentStatus = pgEnum('enrollment_status', [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
]);
export const progressStatus = pgEnum('progress_status', [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
]);
export const paymentStatus = pgEnum('payment_status', ['PENDING', 'APPROVED', 'DECLINED']);
export const certificateStatus = pgEnum('certificate_status', ['PENDING', 'GENERATED', 'REVOKED']);
export const notificationStatus = pgEnum('notification_status', ['PENDING', 'SENT', 'FAILED']);
export const notificationChannel = pgEnum('notification_channel', ['IN_APP', 'EMAIL']);
export const jobStatus = pgEnum('job_status', ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']);

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
    status: userStatus('status').notNull().default('PENDING'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('users_email_normalized_uidx').on(table.emailNormalized),
    uniqueIndex('users_google_id_uidx').on(table.googleId),
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

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  emailNormalized: text('email_normalized').notNull(),
  successful: boolean('successful').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull().unique(),
  description: text('description'),
});
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  description: text('description'),
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
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('categories_parent_idx').on(table.parentId),
    index('categories_active_idx')
      .on(table.name)
      .where(sql`${table.archivedAt} IS NULL`),
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
    presenterName: text('presenter_name').notNull(),
    status: courseStatus('status').notNull().default('DRAFT'),
    visibility: courseVisibility('visibility').notNull().default('PRIVATE'),
    accessType: courseAccessType('access_type').notNull().default('FREE'),
    featured: boolean('featured').notNull().default(false),
    price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('USD'),
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

export const courseSections = pgTable(
  'course_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    position: integer('position').notNull(),
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
    position: integer('position').notNull(),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique('lessons_course_slug_uq').on(table.courseId, table.slug),
    index('lessons_section_position_idx').on(table.sectionId, table.position),
    index('lessons_active_course_idx')
      .on(table.courseId, table.position)
      .where(sql`${table.archivedAt} IS NULL`),
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
    storageKey: text('storage_key').notNull(),
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
    status: enrollmentStatus('status').notNull().default('PENDING'),
    priceAtEnrollment: numeric('price_at_enrollment', { precision: 12, scale: 2 }).notNull(),
    currencyAtEnrollment: text('currency_at_enrollment').notNull(),
    discountAtEnrollment: numeric('discount_at_enrollment', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
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
    index('enrollments_last_lesson_idx').on(table.lastLessonId),
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
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique('lesson_progress_enrollment_lesson_uq').on(table.enrollmentId, table.lessonId),
    index('lesson_progress_lesson_idx').on(table.lessonId),
    index('lesson_progress_enrollment_status_idx').on(table.enrollmentId, table.status),
    index('lesson_progress_recent_idx').on(table.enrollmentId, table.lastViewedAt.desc(), table.id),
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
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull(),
    status: paymentStatus('status').notNull().default('PENDING'),
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
    mimeType: text('mime_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('payment_receipts_payment_idx').on(table.paymentId)],
);

export const certificateTemplates = pgTable(
  'certificate_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    version: integer('version').notNull(),
    configuration: jsonb('configuration').notNull(),
    ...timestamps,
  },
  (table) => [unique('certificate_templates_name_version_uq').on(table.name, table.version)],
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
    status: certificateStatus('status').notNull().default('PENDING'),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('certificates_enrollment_status_idx').on(table.enrollmentId, table.status),
    index('certificates_generated_idx')
      .on(table.issuedAt.desc(), table.id)
      .where(sql`${table.status} = 'GENERATED' AND ${table.revokedAt} IS NULL`),
    index('certificates_template_idx').on(table.templateId),
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
    title: text('title').notNull(),
    body: text('body').notNull(),
    metadata: jsonb('metadata'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
    index('notifications_unread_in_app_idx')
      .on(table.userId, table.createdAt.desc(), table.id)
      .where(sql`${table.readAt} IS NULL AND ${table.channel} = 'IN_APP'`),
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
export const backgroundJobs = pgTable(
  'background_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobType: text('job_type').notNull(),
    status: jobStatus('status').notNull().default('PENDING'),
    payload: jsonb('payload').notNull(),
    priority: integer('priority').notNull().default(100),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('background_jobs_pending_claim_idx')
      .on(table.scheduledAt, table.priority, table.id)
      .where(sql`${table.status} = 'PENDING'`),
    index('background_jobs_locked_idx').on(table.status, table.lockedAt),
    index('background_jobs_type_schedule_idx').on(table.jobType, table.status, table.scheduledAt),
  ],
);

export const schema = {
  users,
  userProfiles,
  refreshSessions,
  emailVerificationTokens,
  passwordResetTokens,
  loginAttempts,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  categories,
  courses,
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
  notifications,
  activityLogs,
  platformSettings,
  backgroundJobs,
};
