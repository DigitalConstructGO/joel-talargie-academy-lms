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
    const pending = await database
      .select({
        certificateId: schema.certificates.id,
        enrollmentId: schema.certificates.enrollmentId,
        generationVersion: schema.certificates.generationVersion,
      })
      .from(schema.certificates)
      .where(eq(schema.certificates.status, 'PENDING'));
    for (const certificate of pending)
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
    process.stdout.write(
      `Certificate reconciliation completed: ${pending.length} pending identities checked.\n`,
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
