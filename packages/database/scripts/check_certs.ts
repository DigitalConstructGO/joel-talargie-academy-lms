import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { getDirectDatabaseUrl } from '../src/config.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env'), quiet: true });
loadEnvironment({ path: resolve(scriptDirectory, '../.env'), quiet: true, override: false });

async function checkCerts() {
  const pool = new Pool({
    connectionString: getDirectDatabaseUrl(),
    max: 1,
  });

  console.log('--- BACKGROUND JOBS ---');
  const jobs = await pool.query(
    'SELECT id, job_type, status, attempts, locked_at, last_error, payload FROM background_jobs ORDER BY created_at DESC LIMIT 10',
  );
  console.table(jobs.rows);

  console.log('\n--- CERTIFICATES ---');
  const certs = await pool.query(
    'SELECT id, enrollment_id, certificate_number, student_name_at_issue, status, pdf_storage_key, created_at FROM certificates ORDER BY created_at DESC LIMIT 10',
  );
  console.table(certs.rows);

  console.log('\n--- COMPLETED ENROLLMENTS ---');
  const enrollments = await pool.query(
    "SELECT id, student_id, course_id, status, progress_percentage, completed_at FROM enrollments WHERE status = 'COMPLETED' LIMIT 10",
  );
  console.table(enrollments.rows);

  await pool.end();
}

checkCerts().catch(console.error);
