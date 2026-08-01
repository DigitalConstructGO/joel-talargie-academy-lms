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

export function validateDatabaseUrl(value: string): string {
  return value;
}
