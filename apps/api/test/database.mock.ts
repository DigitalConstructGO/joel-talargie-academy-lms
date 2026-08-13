// Real drizzle-orm query-builder operators are pure, side-effect-free
// functions (they build a SQL AST, they don't execute anything) - re-exporting
// them for real, exactly like the real @joel-academy/database package does,
// lets controller/repository code call eq()/and()/etc. in tests without a
// live database.
export {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';

// `schema` itself has no live database to describe, but code under test may
// still reference arbitrary `schema.someTable.someColumn` paths (e.g. a
// controller building a raw where-clause). An infinite proxy resolves any
// such chain to another proxy instead of throwing on `undefined.someColumn`.
function columnProxy(): unknown {
  return new Proxy(() => undefined, { get: () => columnProxy() });
}
export const schema: Record<string, unknown> = new Proxy(
  {},
  { get: () => columnProxy() },
);
export const checkDatabaseConnection = async (database: {
  execute: () => Promise<unknown>;
}): Promise<void> => {
  await database.execute();
};
export const createDatabaseClient = (pool: unknown): unknown => pool;
export const insertActivityLog = jest.fn(async (): Promise<void> => undefined);
export const insertBackgroundJob = jest.fn(
  async (): Promise<string> => 'job-id',
);
export const updateBackgroundJobStatus = jest.fn(
  async (): Promise<boolean> => true,
);
export const findAuthUserByEmail = jest.fn();
export const findAuthUserById = jest.fn();
export const createStudentUser = jest.fn();
export const createRefreshSession = jest.fn();
export const rotateRefreshSession = jest.fn();
export const revokeRefreshSession = jest.fn();
export const revokeUserSessions = jest.fn();
export const findRefreshSession = jest.fn();
export const recordLoginAttempt = jest.fn();
export const updateLastLogin = jest.fn();
export const createPasswordReset = jest.fn();
export const consumePasswordReset = jest.fn();
export const consumeEmailVerification = jest.fn();
export const changeUserPassword = jest.fn();
export const findAuthUserByGoogleId = jest.fn();
export const upsertGoogleUser = jest.fn();
export const PERMISSION_CODES = ['permissions.read', 'roles.read'];
export const getAuthorizationContext = jest.fn();
export const listPermissionCatalog = jest.fn();
export const listRoles = jest.fn();
export const getRoleDetails = jest.fn();
export const createRoleWithPermissions = jest.fn();
export const updateCustomRole = jest.fn();
export const replaceCustomRolePermissions = jest.fn();
export const archiveCustomRole = jest.fn();
export const listUserRoles = jest.fn();
export const assignRoleToUser = jest.fn();
export const removeRoleFromUser = jest.fn();
export const getSafeUser = jest.fn();
export const updateSafeProfile = jest.fn();
export const getUserPreferences = jest.fn();
export const updateUserPreferences = jest.fn();
export const listActiveSessions = jest.fn();
export const revokeOwnedSession = jest.fn();
export const revokeSessionsExcept = jest.fn();
export const listManagedUsers = jest.fn();
export const getUserRecordSummary = jest.fn();
export const transitionUserStatus = jest.fn();
export const listUserActivity = jest.fn();

// `EMAIL_TEMPLATE_CONTENT` is pure code (no live database) in the database
// package, and Jest only transforms files inside the API root dir - so
// re-exporting the real module would fail at runtime with a raw ESM syntax
// error. The mock therefore supplies a representative typed fixture instead.
// Production code reads the full real catalog via `@joel-academy/database`;
// only unit tests see this subset, and the code under test consumes it the
// same way. The type-only import keeps the fixture checked against the real
// catalog types while being erased at runtime.
import type {
  EmailTemplateCode,
  EmailTemplateContent,
} from '../../../packages/database/src/seed/email-template-content.ts';

export const EMAIL_TEMPLATE_CONTENT: Partial<
  Record<EmailTemplateCode, EmailTemplateContent>
> = {
  EMAIL_VERIFICATION: {
    subject: 'Verify your email to get started',
    html: '<p>Verify your email: {{verificationUrl}}</p>',
    text: 'Verify your email: {{verificationUrl}}',
  },
  WELCOME: {
    subject: 'Welcome to Joel Talargie Academy!',
    html: '<p>Welcome: {{dashboardUrl}}</p>',
    text: 'Welcome: {{dashboardUrl}}',
  },
  GOOGLE_SIGN_IN: {
    subject: 'New Google sign-in',
    html: '<p>New sign-in with Google.</p>',
    text: 'New sign-in with Google.',
  },
  PASSWORD_CHANGED: {
    subject: 'Your password was changed',
    html: '<p>Your {{academyName}} password was changed.</p>',
    text: 'Your {{academyName}} password was changed.',
  },
};

export function validateDatabaseUrl(value: string): string {
  return value;
}
