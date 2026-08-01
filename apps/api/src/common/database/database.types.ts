import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { schema } from '@joel-academy/database';

export type AcademyDatabase = NodePgDatabase<typeof schema>;
