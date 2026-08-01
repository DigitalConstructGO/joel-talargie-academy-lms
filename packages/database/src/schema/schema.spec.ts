import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationDirectory = join(process.cwd(), 'migrations');
const migrationSql = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => readFileSync(join(migrationDirectory, file), 'utf8'))
  .join('\n');

describe('database migration quality', () => {
  it('contains the required unique constraints', () => {
    for (const fragment of [
      'users_email_normalized_uidx',
      'user_profiles_user_id_unique',
      'roles_code_unique',
      'roles_name_unique',
      'permissions_code_unique',
      'user_roles_user_id_role_id_pk',
      'role_permissions_role_id_permission_id_pk',
      'categories_slug_unique',
      'courses_slug_unique',
      'lessons_course_slug_uq',
      'enrollments_student_course_uq',
      'lesson_progress_enrollment_lesson_uq',
      'payments_enrollment_attempt_uq',
      'certificate_templates_name_version_uq',
      'certificates_certificate_number_unique',
      'certificates_verification_token_unique',
      'platform_settings_key_unique',
    ])
      expect(migrationSql).toContain(fragment);
  });

  it('contains query-driven foreign-key, composite, and partial indexes', () => {
    for (const name of [
      'courses_catalog_idx',
      'courses_category_catalog_idx',
      'enrollments_student_status_updated_idx',
      'lesson_progress_lesson_idx',
      'lesson_progress_enrollment_status_idx',
      'payments_pending_queue_idx',
      'certificates_enrollment_status_idx',
      'notifications_unread_in_app_idx',
      'activity_logs_entity_created_idx',
      'background_jobs_pending_claim_idx',
      'platform_settings_updated_by_idx',
    ])
      expect(migrationSql).toContain(name);
    expect(migrationSql).toContain('WHERE "payments"."status" = \'PENDING\'');
    expect(migrationSql).toContain('USING gin ("search_vector")');
  });

  it('does not define duplicate index names', () => {
    const names = [...migrationSql.matchAll(/CREATE (?:UNIQUE )?INDEX "([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses exact money and timezone-aware timestamp types', () => {
    expect(migrationSql).toContain('numeric(12, 2)');
    expect(migrationSql).not.toMatch(/\b(real|double precision)\b/i);
    expect(migrationSql).toContain('timestamp with time zone');
  });
});
