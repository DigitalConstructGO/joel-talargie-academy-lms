import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Pool } from 'pg';
import { DATABASE_CLIENT, DATABASE_POOL } from './database.constants';
import type { AcademyDatabase } from './database.types';

export type DatabaseConnectionStatus =
  'available' | 'not-configured' | 'unavailable';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool | null,
    @Inject(DATABASE_CLIENT) private readonly database: AcademyDatabase | null,
  ) {}

  get client(): AcademyDatabase {
    if (!this.database) throw new Error('Database is not configured');
    return this.database;
  }

  async checkConnection(): Promise<DatabaseConnectionStatus> {
    if (!this.database) return 'not-configured';
    try {
      await this.database.execute(sql`select 1`);
      return 'available';
    } catch {
      return 'unavailable';
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end();
  }
}
