import { config as loadEnvironment } from 'dotenv';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import { schema } from '../src/schema/index.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, '../../..');

loadEnvironment({ path: resolve(rootDirectory, '.env'), quiet: true });

async function importToSqlite() {
  const backupFolder = resolve(rootDirectory, 'backups');
  if (!existsSync(backupFolder)) {
    throw new Error(`Backup folder not found at ${backupFolder}`);
  }

  const files = readdirSync(backupFolder)
    .filter((f) => f.startsWith('joel_academy_backup_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No JSON backup files found in backups folder');
  }

  const latestBackupFile = resolve(backupFolder, files[0]!);
  process.stdout.write(`Reading backup file: ${latestBackupFile}\n`);

  const rawData = readFileSync(latestBackupFile, 'utf-8');
  const backupData: Record<string, any[]> = JSON.parse(rawData);

  const dbPath = process.env.DATABASE_URL || resolve(rootDirectory, 'sqlite.db');
  process.stdout.write(`Target SQLite Database: ${dbPath}\n`);

  const sqliteClient = new Database(dbPath);
  sqliteClient.pragma('foreign_keys = OFF'); // Disable FK constraints during bulk import

  const db = drizzle(sqliteClient, { schema });

  // 1. Create tables in SQLite dynamically based on schema definitions
  process.stdout.write('Initializing SQLite schema...\n');

  // We can use drizzle push / raw SQL DDL or table creation statements
  // For SQLite, creating tables if not exists:
  const tables = Object.keys(schema) as (keyof typeof schema)[];

  // We execute sqlite table creation
  // Or we can use Drizzle's db.run statements
  // Let's create schema using raw queries if tables don't exist
  // Or we can use sqliteClient statements for each table in backupData

  for (const [tableName, rows] of Object.entries(backupData)) {
    if (!rows || rows.length === 0) continue;

    process.stdout.write(`Importing table '${tableName}' (${rows.length} rows)...\n`);

    // Get table columns from the first row
    const firstRow = rows[0];
    const columns = Object.keys(firstRow);

    // Create table if not exists with generic text/numeric/integer columns
    const colDefs = columns.map((col) => `"${col}" TEXT`).join(', ');
    sqliteClient.exec(`CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs})`);

    // Clear existing data
    sqliteClient.exec(`DELETE FROM "${tableName}"`);

    // Insert rows
    const placeholders = columns.map(() => '?').join(', ');
    const insertStmt = sqliteClient.prepare(
      `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
    );

    const insertMany = sqliteClient.transaction((items: any[]) => {
      for (const item of items) {
        const values = columns.map((col) => {
          const val = item[col];
          if (val === null || val === undefined) return null;
          if (typeof val === 'object') return JSON.stringify(val);
          if (typeof val === 'boolean') return val ? 1 : 0;
          return String(val);
        });
        insertStmt.run(values);
      }
    });

    insertMany(rows);
    process.stdout.write(`  ✔ Successfully imported ${rows.length} rows into '${tableName}'\n`);
  }

  sqliteClient.pragma('foreign_keys = ON'); // Re-enable FK constraints
  sqliteClient.close();

  process.stdout.write('\n✅ All database records imported into SQLite successfully!\n');
}

importToSqlite().catch((err) => {
  process.stderr.write(`❌ SQLite import failed: ${err.message}\n`);
  process.exit(1);
});
