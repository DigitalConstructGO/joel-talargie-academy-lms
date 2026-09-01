import { createDatabaseClient, sql } from '../packages/database/src/index';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('sqlite.db');
const client = new Database(dbPath);
const db = createDatabaseClient(client);

async function testAllQueries() {
  console.log('--- Testing All Database Queries & Operators on SQLite ---');
  let pass = 0,
    fail = 0;

  async function check(name: string, fn: () => any) {
    try {
      await fn();
      console.log('✅ PASS:', name);
      pass++;
    } catch (err: any) {
      console.error('❌ FAIL:', name, err.message);
      fail++;
    }
  }

  await check('Select 1', () => db.execute(sql`SELECT 1`));

  await check('Users & Profiles', () => db.query.users.findMany({ limit: 5 }));

  await check('Courses list', () => db.query.courses.findMany({ limit: 5 }));

  await check('Categories list', () => db.query.categories.findMany({ limit: 5 }));

  await check('Enrollments list', () => db.query.enrollments.findMany({ limit: 5 }));

  await check('Payments list', () => db.query.payments.findMany({ limit: 5 }));

  await check('Payment Methods', () => db.query.paymentMethods.findMany({ limit: 5 }));

  await check('Notifications & Deliveries', () => db.query.emailDeliveries.findMany({ limit: 5 }));

  await check('Certificates list', () => db.query.certificates.findMany({ limit: 5 }));

  await check('Report Exports list', () => db.query.reportExports.findMany({ limit: 5 }));

  await check('Activity Logs list', () => db.query.activityLogs.findMany({ limit: 5 }));

  await check('Promo Codes list', () => db.query.promoCodes.findMany({ limit: 5 }));

  await check('Case-insensitive search query (LIKE / ILIKE / ilike)', () =>
    db.execute(sql`SELECT id, title FROM courses WHERE title LIKE '%web%' OR title ILIKE '%web%'`),
  );

  await check('Sanitized FOR UPDATE query', () =>
    db.execute(sql`SELECT id FROM courses WHERE id = '123' FOR UPDATE`),
  );

  await check('Sanitized FTS @@ query', () =>
    db.execute(
      sql`SELECT id FROM courses WHERE search_vector @@ websearch_to_tsquery('simple', 'web')`,
    ),
  );

  await check('Sanitized NOW() query', () =>
    db.execute(sql`SELECT id FROM courses WHERE created_at <= NOW()`),
  );

  console.log('\n==============================');
  console.log('Passed:', pass);
  console.log('Failed:', fail);
}

testAllQueries();
