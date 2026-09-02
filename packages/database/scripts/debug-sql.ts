import Database from 'better-sqlite3';
import path from 'path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { schema } from '../src/schema/index.ts';

const dbPath = path.resolve('sqlite.db');
const db = new Database(dbPath);
const drizzleDb = drizzle(db, { schema, logger: true });

const query = drizzleDb
  .insert(schema.accountLinkTokens)
  .values({
    id: 'test-id',
    userId: 'user-id-123',
    purpose: 'TELEGRAM_LINK',
    tokenHash: 'hash-123',
    expiresAt: new Date(),
  })
  .toSQL();

console.log('GENERATED SQL:', query.sql);
console.log('GENERATED PARAMS:', query.params);

db.close();
