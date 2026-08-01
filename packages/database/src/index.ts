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
