import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createDatabaseClient,
  validateDatabaseUrl,
} from '@joel-academy/database';
import { Pool } from 'pg';
import type { Environment } from '../../config/environment';
import { DATABASE_CLIENT, DATABASE_POOL } from './database.constants';
import { DatabaseService } from './database.service';
import type { AcademyDatabase } from './database.types';

function createPool(config: ConfigService<Environment, true>): Pool | null {
  const connectionString = config.get('DATABASE_URL', { infer: true });
  if (!connectionString) return null;

  return new Pool({
    connectionString: validateDatabaseUrl(connectionString, {
      requireNeon: true,
      requirePooled: true,
    }),
    max: config.get('DATABASE_POOL_MAX', { infer: true }),
    connectionTimeoutMillis: config.get('DATABASE_CONNECTION_TIMEOUT_MS', {
      infer: true,
    }),
    idleTimeoutMillis: config.get('DATABASE_IDLE_TIMEOUT_MS', { infer: true }),
  });
}

function createDatabase(pool: Pool | null): AcademyDatabase | null {
  return pool ? createDatabaseClient(pool) : null;
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
