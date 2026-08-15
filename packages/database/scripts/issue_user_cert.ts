import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { randomBytes } from 'node:crypto';
import { getDirectDatabaseUrl } from '../src/config.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env'), quiet: true });
loadEnvironment({ path: resolve(scriptDirectory, '../.env'), quiet: true, override: false });

async function issueCertificateForEnrollment() {
  const pool = new Pool({
    connectionString: getDirectDatabaseUrl(),
    max: 1,
  });

  const enrollmentId = 'fa4caa23-6223-4088-8b8b-5cafa33318e6';
  const studentId = 'a56a457c-8d25-4959-97ce-9368c988ec0a';

  // Check eligibility
  const elRes = await pool.query(`
    SELECT e.id, e.status, e.progress_percentage, e.completed_at, c.title as course_title, c.certificate_enabled,
           up.first_name, up.last_name, u.email
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    JOIN users u ON u.id = e.student_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE e.id = $1
  `, [enrollmentId]);

  const el = elRes.rows[0];
  console.log('Enrollment details:', el);

  const tplRes = await pool.query('SELECT id, name, version, configuration FROM certificate_templates WHERE is_default = true LIMIT 1');
  const tpl = tplRes.rows[0];

  const date = new Date();
  const certNumber = `JTA-${date.getUTCFullYear()}-${randomBytes(16).toString('hex').toUpperCase()}`;
  const verificationToken = randomBytes(32).toString('base64url');
  const studentName = `${el.first_name} ${el.last_name}`;

  const insertCert = await pool.query(`
    INSERT INTO certificates (
      enrollment_id, template_id, certificate_number, verification_token,
      student_name_at_issue, course_title_at_issue, completion_date_snapshot,
      template_name_snapshot, template_version_snapshot, status, generation_version
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', 1)
    RETURNING *
  `, [
    enrollmentId, tpl.id, certNumber, verificationToken,
    studentName, el.course_title, el.completed_at,
    tpl.name, tpl.version
  ]);

  const cert = insertCert.rows[0];
  console.log('Certificate created in PENDING status:', cert);

  const jobRes = await pool.query(`
    INSERT INTO background_jobs (
      job_type, deduplication_key, payload
    ) VALUES (
      'GENERATE_CERTIFICATE', $1, $2
    )
    RETURNING *
  `, [`certificate:generate:${cert.id}:v1`, JSON.stringify({ certificateId: cert.id, enrollmentId })]);

  console.log('Background job created:', jobRes.rows[0]);

  await pool.end();
}

issueCertificateForEnrollment().catch(console.error);
