import { config as loadEnvironment } from 'dotenv';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, '../../..');

loadEnvironment({ path: resolve(rootDirectory, '.env.hostinger'), quiet: true });
loadEnvironment({ path: resolve(rootDirectory, '.env.production'), quiet: true, override: false });
loadEnvironment({ path: resolve(rootDirectory, '.env'), quiet: true, override: false });

async function exportDatabase() {
  const connectionString = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_DIRECT_URL or DATABASE_URL is missing');
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 15_000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();

    // Get all user tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map((row) => row.table_name);
    const backupData: Record<string, unknown[]> = {};

    process.stdout.write(`Exporting ${tables.length} tables from PostgreSQL...\n`);

    for (const table of tables) {
      const dataResult = await client.query(`SELECT * FROM "${table}"`);
      backupData[table] = dataResult.rows;
      process.stdout.write(`  ✔ Exported ${dataResult.rows.length} rows from table '${table}'\n`);
    }

    client.release();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolder = resolve(rootDirectory, 'backups');
    if (!existsSync(backupFolder)) {
      mkdirSync(backupFolder, { recursive: true });
    }

    const backupFilePath = resolve(backupFolder, `joel_academy_backup_${timestamp}.json`);
    writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

    process.stdout.write(
      `\n✅ Database backup completed successfully!\nFile saved to: ${backupFilePath}\n`,
    );
  } finally {
    await pool.end();
  }
}

exportDatabase().catch((error) => {
  process.stderr.write(`❌ Database export failed: ${error.message}\n`);
  process.exit(1);
});
