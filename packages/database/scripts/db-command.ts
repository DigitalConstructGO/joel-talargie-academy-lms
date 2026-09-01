import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { schema } from '../src/schema/index.ts';
import { permissionSeed } from '../src/permission-catalog.ts';
import { eq } from 'drizzle-orm';
import {
  demoDataAlreadySeeded,
  seedCategories,
  seedCourses,
  seedDemoData,
} from '../src/seed/demo-seed.ts';
import { INSTRUCTOR_PERSON } from '../src/seed/demo-data.ts';
import {
  EMAIL_TEMPLATE_CONTENT,
  type EmailTemplateCode,
} from '../src/seed/email-template-content.ts';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env'), quiet: true });
loadEnvironment({ path: resolve(scriptDirectory, '../.env'), quiet: true, override: false });

type DatabaseCommand = 'check' | 'migrate' | 'seed';

const emailTemplateCodes = Object.keys(EMAIL_TEMPLATE_CONTENT) as EmailTemplateCode[];

async function run(): Promise<void> {
  const command = process.argv[2] as DatabaseCommand | undefined;
  if (!command || !['check', 'migrate', 'seed'].includes(command)) {
    throw new Error('A supported database command is required');
  }

  const dbPath = process.env.DATABASE_URL || 'sqlite.db';
  const client = new Database(dbPath);

  try {
    if (command === 'migrate') {
      await migrate(drizzle(client), { migrationsFolder: './migrations-sqlite' });
      process.stdout.write('Database migrations completed safely.\n');
      return;
    }

    if (command === 'seed') {
      const database: any = drizzle(client, { schema });
      await database.transaction(async (tx: any) => {
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
          .values(
            permissions.map(({ id }: any) => ({ roleId: administrator.id, permissionId: id })),
          )
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
              subjectTemplate: EMAIL_TEMPLATE_CONTENT[code].subject,
              htmlTemplate: EMAIL_TEMPLATE_CONTENT[code].html,
              textTemplate: EMAIL_TEMPLATE_CONTENT[code].text,
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
        await database.transaction(async (tx: any) => {
          const instructor = await tx.query.users.findFirst({
            where: eq(schema.users.emailNormalized, normalizeEmail(INSTRUCTOR_PERSON.email)),
          });
          if (instructor) {
            const categoryBySlug = await seedCategories(tx);
            await seedCourses(tx, categoryBySlug as any, instructor.id);
          }
        });
        process.stdout.write('RBAC roles, categories, and course catalog synced.\n');
        return;
      }

      const demoCounts = await seedDemoData(database);
      process.stdout.write('RBAC roles and permission catalog seeded idempotently.\n');
      process.stdout.write(`Demo dataset seeded: ${JSON.stringify(demoCounts)}\n`);
      return;
    }
    client.exec('select 1');
    process.stdout.write('Database connection check passed.\n');
  } finally {
    client.close();
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
