import { describe, expect, it } from 'vitest';
import { assertIsolatedTestDatabase, validateDatabaseUrl } from './config.ts';

const pooled = 'postgresql://user:secret@project-pooler.neon.tech/academy?sslmode=require';
const direct = 'postgresql://user:secret@project.neon.tech/academy?sslmode=require';

describe('database configuration', () => {
  it('accepts pooled and direct Neon URLs for their intended roles', () => {
    expect(validateDatabaseUrl(pooled, { requireNeon: true, requirePooled: true })).toBe(pooled);
    expect(validateDatabaseUrl(direct, { requireNeon: true, requireDirect: true })).toBe(direct);
  });

  it.each(['', 'mysql://host/database', 'postgresql://host/database?sslmode=disable'])(
    'rejects invalid or insecure URLs without revealing their contents',
    (value) =>
      expect(() => validateDatabaseUrl(value)).toThrow('Database configuration is invalid'),
  );

  it('refuses a test database shared with runtime or migration operations', () => {
    expect(() =>
      assertIsolatedTestDatabase({
        DATABASE_TEST_URL: direct,
        DATABASE_URL: pooled,
        DATABASE_DIRECT_URL: direct,
      }),
    ).toThrow('Test database configuration is not isolated');
  });
});
