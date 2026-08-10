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
import { demoDataAlreadySeeded, seedDemoData } from '../src/seed/demo-seed.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env'), quiet: true });
loadEnvironment({ path: resolve(scriptDirectory, '../.env'), quiet: true, override: false });

type DatabaseCommand = 'check' | 'migrate' | 'seed';

const emailTemplateCodes = [
  'EMAIL_VERIFICATION',
  'PASSWORD_RESET',
  'PASSWORD_CHANGED',
  'NEW_LOGIN_ALERT',
  'GOOGLE_ACCOUNT_LINKED',
  'GOOGLE_ACCOUNT_UNLINKED',
  'ACCOUNT_ACTIVATED',
  'ACCOUNT_SUSPENDED',
  'ACCOUNT_ARCHIVED',
  'ACCOUNT_RESTORED',
  'ROLE_ASSIGNED',
  'ROLE_REMOVED',
  'SESSION_REVOKED_BY_ADMIN',
  'FREE_ENROLLMENT_CONFIRMED',
  'PAID_ENROLLMENT_CREATED',
  'PAYMENT_SUBMITTED',
  'PAYMENT_APPROVED',
  'PAYMENT_DECLINED',
  'COURSE_COMPLETED',
  'CERTIFICATE_READY',
  'CERTIFICATE_REVOKED',
] as const;

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
          .insert(schema.rolePermissions)
          .values(permissions.map(({ id }) => ({ roleId: administrator.id, permissionId: id })))
          .onConflictDoNothing();
        await tx
          .insert(schema.platformSettings)
          .values([
            { key: 'payment.manual.enabled', value: true },
            { key: 'payment.bank_name', value: 'Configured Bank' },
            { key: 'payment.account_name', value: 'Joel Talargie Academy' },
            { key: 'payment.account_number', value: 'Configure before production use' },
            { key: 'payment.branch', value: 'Configured branch' },
            {
              key: 'payment.reference_instructions',
              value: 'Include your full name where supported.',
            },
            {
              key: 'payment.general_instructions',
              value: ['Transfer the exact amount.', 'Upload a clear receipt.'],
            },
            { key: 'payment.default_currency', value: 'ETB' },
            { key: 'payment.receipt_max_size_mb', value: 12 },
            {
              key: 'payment.receipt_allowed_types',
              value: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
            },
            { key: 'payment.support_contact', value: 'Configure academy support contact' },
          ])
          .onConflictDoNothing({ target: schema.platformSettings.key });
        await tx
          .insert(schema.certificateTemplates)
          .values({
            name: 'Joel Talargie Academy Default',
            version: 1,
            isActive: true,
            isDefault: true,
            configuration: {
              academyName: 'Joel Talargie Academy',
              title: 'Certificate of Completion',
              primaryColor: '#15324A',
              accentColor: '#C9A227',
              footerText: 'Issued by Joel Talargie Academy',
            },
          })
          .onConflictDoNothing();
        await tx
          .insert(schema.emailTemplates)
          .values(
            emailTemplateCodes.map((code) => ({
              code,
              name: code
                .toLowerCase()
                .split('_')
                .map((part) => part[0]!.toUpperCase() + part.slice(1))
                .join(' '),
              subjectTemplate: `Joel Talargie Academy: ${code.toLowerCase().replaceAll('_', ' ')}`,
              htmlTemplate:
                '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#15324a"><main style="max-width:600px;margin:auto"><h1>Joel Talargie Academy</h1><p>Hello {{recipientName}},</p><p>This is an important transactional notification about your academy account.</p><p>If you need help, contact academy support.</p><hr><small>Joel Talargie Academy</small></main></body></html>',
              textTemplate:
                'Joel Talargie Academy\n\nHello {{recipientName}},\n\nThis is an important transactional notification about your academy account.\n\nContact academy support if you need help.',
              version: 1,
              locale: 'en',
              isActive: true,
              isSystem: true,
              description: `System transactional template for ${code}.`,
            })),
          )
          .onConflictDoNothing();
      });

      const alreadySeeded = await demoDataAlreadySeeded(database);
      if (alreadySeeded) {
        process.stdout.write(
          'RBAC roles and permission catalog seeded idempotently. Demo dataset already present - skipped.\n',
        );
        return;
      }

      const demoCounts = await seedDemoData(database);
      process.stdout.write('RBAC roles and permission catalog seeded idempotently.\n');
      process.stdout.write(`Demo dataset seeded: ${JSON.stringify(demoCounts)}\n`);
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
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : undefined;
  const source = cause ?? (error instanceof Error ? error : undefined);
  const detail = source
    ? source.message
        .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[REDACTED_DATABASE_URL]')
        .replace(/password\s*[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
    : 'Unknown database error';
  const code = source && 'code' in source ? String(source.code) : 'UNKNOWN';
  process.stderr.write(
    missing
      ? 'Database command failed: DATABASE_DIRECT_URL is missing. Add it to the repository .env file.\n'
      : `Database command failed (${code}): ${detail}\n`,
  );
  process.exitCode = 1;
});
