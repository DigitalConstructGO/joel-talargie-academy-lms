import crypto from 'node:crypto';
import { config as loadEnvironment } from 'dotenv';
import { resolve } from 'node:path';
import {
  createDatabaseClient,
  eq,
  schema,
  validateDatabaseUrl,
} from '@joel-academy/database';
import Database from 'better-sqlite3';

loadEnvironment({ path: resolve(process.cwd(), '../../.env'), quiet: true });
loadEnvironment({
  path: resolve(process.cwd(), '.env'),
  quiet: true,
  override: false,
});

async function run() {
  const dbPath = process.env.DATABASE_URL || 'sqlite.db';
  const client = new Database(dbPath);
  try {
    const database = createDatabaseClient(client);

    // 1. Find completed enrollments without an active certificate
    const completedEnrollments = await database
      .select({
        id: schema.enrollments.id,
        studentId: schema.enrollments.studentId,
        courseId: schema.enrollments.courseId,
      })
      .from(schema.enrollments)
      .where(eq(schema.enrollments.status, 'COMPLETED'));

    const existingCertificates = await database
      .select({
        enrollmentId: schema.certificates.enrollmentId,
      })
      .from(schema.certificates);

    const existingSet = new Set(
      existingCertificates.map((c) => c.enrollmentId),
    );

    let createdCount = 0;
    for (const enrollment of completedEnrollments) {
      if (!existingSet.has(enrollment.id)) {
        try {
          const number = `JTA-${new Date().getUTCFullYear()}-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
          const token = crypto.randomBytes(32).toString('base64url');

          const [cert] = await database
            .insert(schema.certificates)
            .values({
              enrollmentId: enrollment.id,
              templateId: 'tpl_default_1',
              certificateNumber: number,
              verificationToken: token,
              studentNameAtIssue: 'Student',
              courseTitleAtIssue: 'Academy Course',
              status: 'PENDING',
              generationVersion: 1,
            })
            .returning();

          if (cert) {
            await database
              .insert(schema.backgroundJobs)
              .values({
                jobType: 'GENERATE_CERTIFICATE',
                deduplicationKey: `certificate:generate:${cert.id}:v1`,
                payload: {
                  certificateId: cert.id,
                  enrollmentId: enrollment.id,
                },
              })
              .onConflictDoNothing();
            createdCount += 1;
          }
        } catch {}
      }
    }

    // 2. Queue pending or inconsistent certificates
    const pending = await database
      .select({
        certificateId: schema.certificates.id,
        enrollmentId: schema.certificates.enrollmentId,
        generationVersion: schema.certificates.generationVersion,
      })
      .from(schema.certificates)
      .where(eq(schema.certificates.status, 'PENDING'));

    for (const certificate of pending) {
      await database
        .insert(schema.backgroundJobs)
        .values({
          jobType: 'GENERATE_CERTIFICATE',
          deduplicationKey: `certificate:generate:${certificate.certificateId}:v${certificate.generationVersion}`,
          payload: {
            certificateId: certificate.certificateId,
            enrollmentId: certificate.enrollmentId,
          },
        })
        .onConflictDoNothing();
    }

    process.stdout.write(
      `Certificate reconciliation completed: ${createdCount} new certificates created, ${pending.length} pending identities queued.\n`,
    );
  } finally {
    client.close();
  }
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Certificate reconciliation failed: ${message}\n`);
  process.exitCode = 1;
});
