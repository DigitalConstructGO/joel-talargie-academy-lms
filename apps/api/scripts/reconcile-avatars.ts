import { config as loadEnvironment } from 'dotenv';
import { resolve } from 'node:path';
import {
  createDatabaseClient,
  and,
  eq,
  isNull,
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
    const activeAvatars = await database
      .select({
        userId: schema.uploadedFiles.relatedUserId,
      })
      .from(schema.uploadedFiles)
      .where(
        and(
          eq(schema.uploadedFiles.category, 'AVATAR'),
          isNull(schema.uploadedFiles.deletedAt),
        ),
      );

    let updatedCount = 0;
    for (const record of activeAvatars) {
      if (!record.userId) continue;
      const avatarUrl = `/api/v1/storage/avatar/${record.userId}`;
      await database
        .update(schema.users)
        .set({ avatarUrl, updatedAt: new Date() })
        .where(eq(schema.users.id, record.userId));
      updatedCount++;
    }

    process.stdout.write(
      `Avatar reconciliation completed: ${updatedCount} user avatar URLs updated in database.\n`,
    );
  } finally {
    client.close();
  }
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Avatar reconciliation failed: ${message}\n`);
  process.exitCode = 1;
});
