import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createDatabaseClient,
  validateDatabaseUrl,
} from '@joel-academy/database';
import Database from 'better-sqlite3';
import type { Environment } from '../../config/environment';
import { DATABASE_CLIENT, DATABASE_POOL } from './database.constants';
import { DatabaseService } from './database.service';
import type { AcademyDatabase } from './database.types';

function createPool(
  config: ConfigService<Environment, true>,
): Database.Database | null {
  const rawPath = config.get('DATABASE_URL', { infer: true });
  const dbPath = validateDatabaseUrl(rawPath);
  return new Database(dbPath);
}

function createDatabase(
  client: Database.Database | null,
): AcademyDatabase | null {
  return client ? createDatabaseClient(client) : null;
}

@Module({
  providers: [
    { provide: DATABASE_POOL, inject: [ConfigService], useFactory: createPool },
    {
      provide: DATABASE_CLIENT,
      inject: [DATABASE_POOL],
      useFactory: createDatabase,
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
