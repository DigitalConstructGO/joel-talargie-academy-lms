export const schema = {};
export const checkDatabaseConnection = async (database: {
  execute: () => Promise<unknown>;
}): Promise<void> => {
  await database.execute();
};
export const createDatabaseClient = (pool: unknown): unknown => pool;
export const insertActivityLog = async (): Promise<void> => undefined;
export const insertBackgroundJob = async (): Promise<string> => 'job-id';
export const updateBackgroundJobStatus = async (): Promise<boolean> => true;
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

export function validateDatabaseUrl(value: string): string {
  return value;
}
