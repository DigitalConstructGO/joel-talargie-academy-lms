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
    // Server-side backstop so a runaway query can never hold a pooled Neon
    // connection (or a client-side handler) open indefinitely.
    statement_timeout: config.get('DATABASE_STATEMENT_TIMEOUT_MS', {
      infer: true,
    }),
    query_timeout: config.get('DATABASE_QUERY_TIMEOUT_MS', { infer: true }),
    // Guards against a bug leaving a transaction open (e.g. an un-awaited
    // branch inside `db.transaction()`), which would otherwise pin a pooled
    // connection until the process restarts.
    idle_in_transaction_session_timeout: config.get(
      'DATABASE_IDLE_IN_TRANSACTION_TIMEOUT_MS',
      { infer: true },
    ),
    // Recycles connections periodically - standard pg-pool guidance for
    // long-lived pools sitting in front of a serverless/pooled Postgres
    // endpoint, so a single connection is never reused indefinitely.
    maxUses: config.get('DATABASE_MAX_USES', { infer: true }),
    // TCP keepalive so idle pooled connections aren't silently dropped by
    // an intermediate proxy/NAT before pg's own idleTimeoutMillis notices.
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
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
