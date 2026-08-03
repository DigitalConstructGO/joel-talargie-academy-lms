import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getDirectDatabaseUrl } from '../src/config.ts';
import { schema } from '../src/schema/index.ts';
import { permissionSeed } from '../src/permission-catalog.ts';
import { eq } from 'drizzle-orm';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env'), quiet: true });
loadEnvironment({ path: resolve(scriptDirectory, '../.env'), quiet: true, override: false });

type DatabaseCommand = 'check' | 'migrate' | 'seed';

async function run(): Promise<void> {
  const command = process.argv[2] as DatabaseCommand | undefined;
  if (!command || !['check', 'migrate', 'seed'].includes(command)) {
    throw new Error('A supported database command is required');
  }
  if (!process.env.DATABASE_DIRECT_URL) {
    throw new Error('DATABASE_DIRECT_URL_MISSING');
  }

  const pool = new Pool({
    connectionString: getDirectDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
  });

  try {
    if (command === 'migrate') {
      await migrate(drizzle({ client: pool }), { migrationsFolder: './migrations' });
      process.stdout.write('Database migrations completed safely.\n');
      return;
    }

    if (command === 'seed') {
      const database = drizzle({ client: pool, schema });
      await database.transaction(async (tx) => {
        await tx
          .insert(schema.permissions)
          .values(permissionSeed)
          .onConflictDoNothing({ target: schema.permissions.code });
        await tx
          .insert(schema.roles)
          .values([
            {
              code: 'ADMINISTRATOR',
              name: 'Administrator',
              description: 'Full academy administration access',
              isSystem: true,
            },
            {
              code: 'STUDENT',
              name: 'Student',
              description: 'Academy learner access',
              isSystem: true,
            },
          ])
          .onConflictDoUpdate({
            target: schema.roles.code,
            set: { isSystem: true, archivedAt: null },
          });
        const administrator = await tx.query.roles.findFirst({
          where: eq(schema.roles.code, 'ADMINISTRATOR'),
        });
        const student = await tx.query.roles.findFirst({ where: eq(schema.roles.code, 'STUDENT') });
        const permissions = await tx.select({ id: schema.permissions.id }).from(schema.permissions);
        if (!administrator || !student) throw new Error('System roles could not be seeded');
        await tx
          .delete(schema.rolePermissions)
          .where(eq(schema.rolePermissions.roleId, administrator.id));
        await tx
          .insert(schema.rolePermissions)
          .values(permissions.map(({ id }) => ({ roleId: administrator.id, permissionId: id })))
          .onConflictDoNothing();
        await tx
          .delete(schema.rolePermissions)
          .where(eq(schema.rolePermissions.roleId, student.id));
      });
      process.stdout.write('RBAC roles and permission catalog seeded idempotently.\n');
      return;
    }
    await pool.query('select 1');
    process.stdout.write('Database connection check passed.\n');
  } finally {
    await pool.end();
  }
}

run().catch((error: unknown) => {
  const missing = error instanceof Error && error.message === 'DATABASE_DIRECT_URL_MISSING';
  process.stderr.write(
    missing
      ? 'Database command failed: DATABASE_DIRECT_URL is missing. Add it to the repository .env file.\n'
      : 'Database command failed. Verify the direct Neon URL, network access, and migration state.\n',
  );
  process.exitCode = 1;
});
