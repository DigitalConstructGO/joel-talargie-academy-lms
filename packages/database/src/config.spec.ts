import { describe, expect, it } from 'vitest';
import { assertIsolatedTestDatabase, validateDatabaseUrl } from './config.ts';

const pooled = 'postgresql://user:secret@project-pooler.neon.tech/academy?sslmode=require';
const direct = 'postgresql://user:secret@project.neon.tech/academy?sslmode=require';

describe('database configuration', () => {
  it('accepts pooled and direct database URLs or paths', () => {
    expect(validateDatabaseUrl(':memory:')).toBe(':memory:');
    expect(validateDatabaseUrl(pooled)).toBeDefined();
    expect(validateDatabaseUrl(direct)).toBeDefined();
  });

  it('handles custom database paths without crashing', () => {
    expect(validateDatabaseUrl('sqlite.db')).toBeDefined();
  });

  it('provides fallback isolated test database', () => {
    expect(assertIsolatedTestDatabase({})).toBe(':memory:');
  });
});
