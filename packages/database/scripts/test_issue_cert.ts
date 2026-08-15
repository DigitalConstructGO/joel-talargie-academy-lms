import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { getDirectDatabaseUrl } from '../src/config.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env'), quiet: true });
loadEnvironment({ path: resolve(scriptDirectory, '../.env'), quiet: true, override: false });

async function testIssue() {
  const pool = new Pool({
    connectionString: getDirectDatabaseUrl(),
    max: 1,
  });

  // Enable certificates for the course
  await pool.query('UPDATE courses SET certificate_enabled = true WHERE id = $1', ['06fc0e16-7ff1-4b69-8dc9-c91c47c6c4a7']);
  console.log('Enabled certificates for course 06fc0e16-7ff1-4b69-8dc9-c91c47c6c4a7');

  await pool.end();
}

testIssue().catch(console.error);
