import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env'), quiet: true });
loadEnvironment({ path: resolve(scriptDirectory, '../.env'), quiet: true, override: false });

async function cleanDemoData(): Promise<void> {
  const dbPath = process.env.DATABASE_URL || 'sqlite.db';
  const client = new Database(dbPath);

  try {
    client.pragma('foreign_keys = OFF');
    client.exec(`
      DELETE FROM lesson_progress;
      DELETE FROM lesson_resources;
      DELETE FROM lessons;
      DELETE FROM course_sections;
      DELETE FROM course_outcomes;
      DELETE FROM course_requirements;
      DELETE FROM enrollments;
      DELETE FROM payments;
      DELETE FROM payment_receipts;
      DELETE FROM certificates;
      DELETE FROM certificate_files;
      DELETE FROM certificate_events;
      DELETE FROM courses;
      DELETE FROM categories;
      DELETE FROM promo_code_course_rules;
      DELETE FROM promo_code_category_rules;
      DELETE FROM promo_code_user_rules;
      DELETE FROM promo_codes;
      DELETE FROM promo_affiliates;
      DELETE FROM background_jobs;
      DELETE FROM email_deliveries;
      DELETE FROM email_delivery_attempts;
      DELETE FROM sms_deliveries;
      DELETE FROM sms_delivery_attempts;
      DELETE FROM activity_logs;
    `);
    client.pragma('foreign_keys = ON');
    process.stdout.write(
      'Demo courses, categories, enrollments, and transactions wiped cleanly.\n',
    );
  } finally {
    client.close();
  }
}

cleanDemoData().catch((error: unknown) => {
  process.stderr.write(`Clean demo failed: ${error}\n`);
  process.exit(1);
});
