export {
  assertIsolatedTestDatabase,
  getDirectDatabaseUrl,
  validateDatabaseUrl,
  type DatabaseUrlOptions,
} from './config.ts';
export { schema } from './schema/index.ts';
export {
  MAX_PAGE_SIZE,
  claimBackgroundJobsQuery,
  pendingPaymentsQuery,
  publicCourseCatalogQuery,
  unreadNotificationsQuery,
  type AcademyDatabase,
  type DateCursor,
} from './queries.ts';
export {
  checkDatabaseConnection,
  createDatabaseClient,
  insertActivityLog,
  insertBackgroundJob,
  updateBackgroundJobStatus,
  type ActivityLogRecord,
  type BackgroundJobRecord,
} from './infrastructure.ts';
export * from './infrastructure.ts';
export * from './rbac.ts';
export * from './permission-catalog.ts';
export * from './users.ts';
export {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  like,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';
export {
  EMAIL_TEMPLATE_CONTENT,
  type EmailTemplateCode,
  type EmailTemplateContent,
} from './seed/email-template-content.ts';
