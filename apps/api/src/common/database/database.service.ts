import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { checkDatabaseConnection } from '@joel-academy/database';
import type Database from 'better-sqlite3';
import { DATABASE_CLIENT, DATABASE_POOL } from './database.constants';
import type { AcademyDatabase } from './database.types';

export type DatabaseConnectionStatus =
  'available' | 'not-configured' | 'unavailable';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Database.Database | null,
    @Inject(DATABASE_CLIENT) private readonly database: AcademyDatabase | null,
  ) {}

  get client(): AcademyDatabase {
    if (!this.database) throw new Error('Database is not configured');
    return this.database;
  }

  async checkConnection(): Promise<DatabaseConnectionStatus> {
    if (!this.database) return 'not-configured';
    try {
      await checkDatabaseConnection(this.database);
      return 'available';
    } catch {
      return 'unavailable';
    }
  }

  onApplicationShutdown(): void {
    this.pool?.close();
  }
}
