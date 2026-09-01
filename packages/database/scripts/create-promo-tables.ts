import Database from 'better-sqlite3';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL || resolve(scriptDirectory, '../sqlite.db');

const sqlStatements = [
  `CREATE TABLE IF NOT EXISTS promo_affiliates (
    id text PRIMARY KEY NOT NULL,
    user_id text,
    name text NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL,
    commission_type text DEFAULT 'PERCENTAGE' NOT NULL,
    commission_rate text,
    commission_fixed_amount text,
    total_clicks integer DEFAULT 0 NOT NULL,
    total_enrollments integer DEFAULT 0 NOT NULL,
    total_revenue text DEFAULT '0' NOT NULL,
    total_commission text DEFAULT '0' NOT NULL,
    notes text,
    created_by text NOT NULL,
    archived_at integer,
    created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
    updated_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS promo_affiliates_user_idx ON promo_affiliates (user_id);`,
  `CREATE INDEX IF NOT EXISTS promo_affiliates_status_idx ON promo_affiliates (status);`,

  `CREATE TABLE IF NOT EXISTS promo_codes (
    id text PRIMARY KEY NOT NULL,
    code text NOT NULL,
    code_type text DEFAULT 'MANUAL' NOT NULL,
    status text DEFAULT 'ACTIVE' NOT NULL,
    discount_type text DEFAULT 'PERCENTAGE' NOT NULL,
    discount_value text DEFAULT '0' NOT NULL,
    owner_user_id text,
    affiliate_id text,
    is_single_use integer DEFAULT false NOT NULL,
    max_users integer,
    redemption_count integer DEFAULT 0 NOT NULL,
    valid_from integer,
    valid_until integer,
    created_by text NOT NULL,
    created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
    updated_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_uq ON promo_codes (code);`,

  `CREATE TABLE IF NOT EXISTS promo_code_course_rules (
    id text PRIMARY KEY NOT NULL,
    code_id text NOT NULL,
    course_id text NOT NULL,
    created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS promo_code_category_rules (
    id text PRIMARY KEY NOT NULL,
    code_id text NOT NULL,
    category_id text NOT NULL,
    created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS promo_code_user_rules (
    id text PRIMARY KEY NOT NULL,
    code_id text NOT NULL,
    user_id text NOT NULL,
    created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS promo_redemptions (
    id text PRIMARY KEY NOT NULL,
    code_id text NOT NULL,
    student_id text NOT NULL,
    course_id text NOT NULL,
    enrollment_id text,
    payment_id text,
    status text DEFAULT 'CONFIRMED' NOT NULL,
    original_price text NOT NULL,
    discount_amount text NOT NULL,
    final_price text NOT NULL,
    currency text NOT NULL,
    affiliate_id text,
    affiliate_commission_amount text,
    ip_address text,
    user_agent text,
    device_type text,
    redeemed_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
    created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
    updated_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS promo_usage_logs (
    id text PRIMARY KEY NOT NULL,
    code_id text,
    actor_id text,
    action text NOT NULL,
    metadata text DEFAULT '{}' NOT NULL,
    ip_address text,
    created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
  );`,
];

console.log(`Connecting to database at ${dbPath}...`);
const client = new Database(dbPath);
for (const stmt of sqlStatements) {
  client.exec(stmt);
}
console.log('Successfully created all promotion tables and indexes!');
client.close();
