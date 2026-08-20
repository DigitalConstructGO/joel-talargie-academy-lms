import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { getDirectDatabaseUrl } from '../src/config.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env'), quiet: true });
loadEnvironment({ path: resolve(scriptDirectory, '../.env'), quiet: true, override: false });

async function checkDetails() {
  const pool = new Pool({
    connectionString: getDirectDatabaseUrl(),
    max: 1,
  });

  const course = await pool.query(
    'SELECT id, title, certificate_enabled FROM courses WHERE id = $1',
    ['06fc0e16-7ff1-4b69-8dc9-c91c47c6c4a7'],
  );
  console.log('Course details:', course.rows[0]);

  const user = await pool.query(
    'SELECT u.id, u.email, up.first_name, up.last_name FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id WHERE u.id = $1',
    ['a56a457c-8d25-4959-97ce-9368c988ec0a'],
  );
  console.log('User details:', user.rows[0]);

  const templates = await pool.query(
    'SELECT id, name, is_active, is_default FROM certificate_templates',
  );
  console.log('Templates:', templates.rows);

  const backgroundJobs = await pool.query(
    "SELECT * FROM background_jobs WHERE payload::text LIKE '%fa4caa23-6223-4088-8b8b-5cafa33318e6%'",
  );
  console.log('Background jobs for enrollment:', backgroundJobs.rows);

  await pool.end();
}

checkDetails().catch(console.error);
