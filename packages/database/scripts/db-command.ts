import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getDirectDatabaseUrl } from '../src/config.ts';

type DatabaseCommand = 'check' | 'migrate' | 'seed';

async function run(): Promise<void> {
  const command = process.argv[2] as DatabaseCommand | undefined;
  if (!command || !['check', 'migrate', 'seed'].includes(command)) {
    throw new Error('A supported database command is required');
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

    await pool.query('select 1');
    process.stdout.write(
      command === 'seed'
        ? 'Database seed completed; no seed records are defined yet.\n'
        : 'Database connection check passed.\n',
    );
  } finally {
    await pool.end();
  }
}

run().catch(() => {
  process.stderr.write('Database command failed. Check the sanitized configuration and target.\n');
  process.exitCode = 1;
});
