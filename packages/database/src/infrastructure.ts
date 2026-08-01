import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { schema } from './schema/index.ts';
import type { AcademyDatabase } from './queries.ts';

export const createDatabaseClient = (pool: Pool): AcademyDatabase =>
  drizzle({ client: pool, schema });
export const checkDatabaseConnection = async (database: AcademyDatabase): Promise<void> => {
  await database.execute(sql`select 1`);
};

export interface ActivityLogRecord {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
export const insertActivityLog = async (
  database: AcademyDatabase,
  record: ActivityLogRecord,
): Promise<void> => {
  await database.insert(schema.activityLogs).values(record);
};

export interface BackgroundJobRecord {
  jobType: string;
  payload: Record<string, unknown>;
  priority?: number;
  scheduledAt?: Date;
}
export const insertBackgroundJob = async (
  database: AcademyDatabase,
  record: BackgroundJobRecord,
): Promise<string> => {
  const [job] = await database
    .insert(schema.backgroundJobs)
    .values({ ...record, scheduledAt: record.scheduledAt ?? new Date() })
    .returning({ id: schema.backgroundJobs.id });
  if (!job) throw new Error('Job could not be created');
  return job.id;
};
export const updateBackgroundJobStatus = async (
  database: AcademyDatabase,
  id: string,
  status: 'PENDING' | 'COMPLETED' | 'FAILED',
): Promise<boolean> => {
  const rows = await database
    .update(schema.backgroundJobs)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.backgroundJobs.id, id))
    .returning({ id: schema.backgroundJobs.id });
  return rows.length === 1;
};
